---
title: "General Network Forensics: Ground-Truth Packet Analysis, Protocol Anomalies, and Attack Detection"
description: "A comprehensive technical guide to network traffic analysis, TCP state lifecycles, protocol anomaly detection across DNS, HTTP, TLS, and SMB, automated tshark extraction pipelines, and hunting adversarial tradecraft."
pubDate: 2026-07-11
category: "Network Forensics"
tags: ["Network Forensics", "Wireshark", "tshark", "PCAP", "DFIR", "Blue Team"] 
readingTime: "18 min read"
featured: true
draft: false
---

<p class="lead">
In post-compromise digital forensics and incident response (DFIR), host-based artifacts can be manipulated, unhooked, or purged by sophisticated adversaries. Wire-level packet captures (PCAP / PCAPNG) provide an unalterable, ground-truth record of physical transactions across the enterprise boundary.
</p>

## 1. Context & Objectives

When responding to advanced intrusions, investigators often encounter hosts where security event logs have been cleared, audit policies tampered with, or memory spaces corrupted before acquisition. In contrast, packet captures recorded at network taps, switch SPAN/mirror ports, or network boundary firewalls preserve the exact sequence of bits transmitted over physical and virtual links.

```text
[Adversary Host] ---> [Switch / SPAN Tap] ---> [Target Network / Host]
                              |
                              v
                   [Raw Packet Capture]
               (Immutable Ground-Truth Data)
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   [Wireshark]            [tshark]               [Zeek]
 (Deep Inspection)   (CLI & Automated)    (NSM Structured Logs)
```

> **INVESTIGATIVE INSIGHT:**
> Host evidence reveals *what a local system recorded*. Network evidence reveals *what actually traversed the wire*. Correlating both is the cornerstone of definitive root-cause analysis.

### Core Investigation Objectives
1. **Decode Layered Wire Encapsulation & Transport States**: Track frames through the TCP/IP stack to discern legitimate application sessions from stealth port scans, session injection, and forceful teardowns.
2. **Perform Deep Packet Dissection Across Enterprise Protocols**: Identify structural baselines and threat anomalies across DNS, HTTP, TLS, and SMB.
3. **Automate Headless Triage Pipelines with `tshark`**: Build automated command-line workflows capable of parsing multi-gigabyte captures without GUI latency.
4. **Hunt Adversary Tradecraft Mapped to MITRE ATT&CK**: Uncover Password Spraying ([T1110.003](https://attack.mitre.org/techniques/T1110/003/)), Protocol Tunneling ([T1071](https://attack.mitre.org/techniques/T1071/) / [T1572](https://attack.mitre.org/techniques/T1572/)), and Data Exfiltration ([T1048](https://attack.mitre.org/techniques/T1048/)).

---

## 2. Environment & Forensic Artifacts

### 2.1 Evidence Storage Formats: PCAP vs. PCAPNG

Selecting and interpreting capture formats dictates what level of timestamp resolution and environmental context is available during an investigation.

| Capability / Feature | Legacy PCAP (`libpcap`) | Modern PCAPNG (Next-Gen) |
| :--- | :--- | :--- |
| **Specification Basis** | Classic 24-byte Global Header | Modular block structure (`SHB`, `IDB`, `EPB`) |
| **Timestamp Precision** | Microsecond (32-bit `sec` + 32-bit `usec`) | Nanosecond or arbitrary fractional precision |
| **Interface Capture** | Single network interface per capture file | Multi-interface capture simultaneously in one file |
| **Hardware Metadata** | None embedded | Hardware model, link speed, OS name, IP subnet |
| **Embedded Notes** | Not supported | Per-packet analyst comments directly in metadata |
| **Name Resolution** | External resolution required | Name Resolution Blocks (`NRB`) store DNS cache |

### 2.2 Forensic Toolkit Matrix

Different phases of network triage demand specialized analytical tooling:

* **Wireshark**: Interactive GUI protocol analyzer. Ideal for Deep Packet Inspection (DPI), visual inspection of complex nested protocol trees, TCP stream reassembly (`Follow TCP Stream`), and byte-level alignment.
* **tshark**: Command-line counterpart of Wireshark. The de facto standard for headless analysis, automated batch processing, and high-speed field extraction on large captures.
* **Zeek (Bro)**: Passive network security monitoring framework. Converts continuous packet streams into structured, compact, tab-separated transaction logs (`conn.log`, `dns.log`, `http.log`, `ssl.log`).
* **NetworkMiner**: Network Forensic Analysis Tool (NFAT). Specializes in automated artifact carving—reconstructing transmitted files, images, credentials, and OS profiles without evaluating filters manually.

### 2.3 Network Forensics Acronym Glossary

| Term | Expansion | Operational Role in Investigations |
| :--- | :--- | :--- |
| **AP** | Access Point | Layer-2 bridge connecting wireless hosts to the wired infrastructure. |
| **BPF** | Berkeley Packet Filter | Kernel-level filter syntax compiled to bytecode for high-speed capture filtering. |
| **C2** | Command and Control | Centralized adversary server infrastructure directing compromised implants. |
| **DGA** | Domain Generation Algorithm | Algorithmic domain generator used by malware to circumvent static DNS blocklists. |
| **DPI** | Deep Packet Inspection | Detailed inspection of payload contents beyond transport layer headers. |
| **FCS** | Frame Check Sequence | 32-bit CRC checksum verifying Layer-2 Ethernet transmission integrity. |
| **IoC** | Indicator of Compromise | Forensically verified evidence indicating system or network breach. |
| **IPC** | Inter-Process Communication | Cross-process communication mechanism; core target in Windows SMB exploitation. |
| **NAT** | Network Address Translation | Mapping internal RFC 1918 private IP addresses to public routable IP endpoints. |
| **NFAT** | Network Forensic Analysis Tool | Tools dedicated to extracting files, credentials, and host artifacts from network dumps. |
| **NSM** | Network Security Monitoring | Continuous monitoring and analysis of network indicators for threat detection. |
| **PCAP** | Packet Capture | Standard file container storing captured raw frames. |
| **RPC** | Remote Procedure Call | Inter-machine execution protocol enabling distributed management. |
| **SMB** | Server Message Block | Core Windows network transport for file shares, named pipes, and RPC services. |
| **SNI** | Server Name Indication | Plaintext TLS handshake extension identifying target hostnames. |
| **TPKT** | Telecommunication Packet | ISO transport service over TCP (RFC 1006) commonly wrapping RDP traffic. |

---

## 3. Methodology: Network Architecture & Encapsulation

### 3.1 TCP/IP 4-Layer Encapsulation Pipeline

Every piece of user or adversary data undergoes progressive encapsulation as it travels down the TCP/IP stack:

<figure>
  <img src="/imgs/blog/network-forensics/tcp_encapsulation.png" alt="TCP/IP Encapsulation and De-encapsulation Process Diagram" loading="lazy" />
  <figcaption>Figure 1: Progressive encapsulation and de-encapsulation of network payload data through the 4-layer TCP/IP stack.</figcaption>
</figure>

1. **Application Layer (Data / Messages)**:
   * Carries high-level application protocols (HTTP, DNS, SMB, TLS).
   * *Investigative Focus*: HTTP request paths, command execution strings, exfiltrated files, and C2 parameters.
2. **Transport Layer (Segments / Datagrams)**:
   * Appends TCP or UDP headers, assigning source/destination ports, sequence numbers, and window sizing.
   * *Investigative Focus*: State transition flags, ephemeral port allocation, abnormal stream resets, and out-of-order retransmissions.
3. **Internet Layer (Packets)**:
   * Adds IPv4/IPv6 routing headers, specifying logical endpoints, Time-to-Live (TTL), and fragmentation flags.
   * *Investigative Focus*: External source geo-location, routing paths, TTL deviations indicating OS spoofing, and covert storage in IP padding.
4. **Network Access Layer (Frames)**:
   * Encapsulates packets into Ethernet frames with physical MAC addresses and calculates the 32-bit Frame Check Sequence (FCS).
   * *Investigative Focus*: NIC manufacturer OUIs, ARP poisoning, and Layer-2 gateway redirection.

### 3.2 TCP Connection State Lifecycle & Flag Dynamics

TCP establishes reliable bidirectional channels through state transitions governed by RFC 9293:

```text
    Client                                   Server
      |                                        |
      | -------- 1. SYN [Seq = X] -----------> |  (SYN_SENT -> LISTEN)
      |                                        |
      | <--- 2. SYN-ACK [Seq = Y, Ack = X+1] - |  (SYN_RECEIVED)
      |                                        |
      | -------- 3. ACK [Seq = X+1, Ack = Y+1] |  (ESTABLISHED)
      |                                        |
      | ================= DATA =============== |
      |                                        |
      | -------- 4. FIN-ACK -----------------> |  (FIN_WAIT_1 -> CLOSE_WAIT)
      | <------- 5. ACK ---------------------- |  (FIN_WAIT_2)
      | <------- 6. FIN-ACK ------------------ |  (LAST_ACK)
      | -------- 7. ACK ---------------------> |  (TIME_WAIT -> CLOSED)
```

The capture excerpt below illustrates a completed TCP 3-way handshake and stream lifecycle:

<figure>
  <img src="/imgs/blog/network-forensics/tcp_stream.png" alt="Wireshark TCP Stream Dissection" loading="lazy" />
  <figcaption>Figure 2: Wireshark packet dissection illustrating the TCP 3-way handshake sequence (SYN &rarr; SYN-ACK &rarr; ACK) and stream tear-down.</figcaption>
</figure>

#### Forensic TCP Flag Combinations Reference

Understanding normative versus anomalous TCP flag combinations enables rapid detection of reconnaissance scans, evasion probes, and covert channels:

| Flag Combination | Standard Name | Functional Purpose | Threat / Forensic Significance |
| :--- | :--- | :--- | :--- |
| `SYN` | TCP SYN | Connection initialization request | Bursts without completing `ACK` indicate SYN Flood DoS or stealth port scanning. |
| `SYN + ACK` | TCP SYN-ACK | Server response accepting connection | Proves target port is open and actively servicing connections. |
| `ACK` | TCP ACK | Session acknowledgment | Validates transmission sequences and stream progression. |
| `FIN + ACK` | TCP FIN-ACK | Orderly bidirectional teardown | Normal graceful termination initiated by client or server. |
| `RST` | TCP Reset | Immediate connection termination | Port is closed, connection rejected, or severed forcefully by security controls. |
| `RST + ACK` | Reset Acknowledgment | Reset acknowledging existing stream | Normal response to unsolicited packets received for inactive connections. |
| `PSH + ACK` | Push Acknowledgment | Immediate buffer flush to application | Active data exchange; characteristic of interactive shell sessions and RPC calls. |
| `FIN + ACK + PSH` | Data Finalization | Final payload preceding close | Final payload delivery just before initiating disconnect. |
| `URG + ACK` | Urgent Acknowledgment | Urgent out-of-band data pointer | Rare in modern stacks; can indicate evasive packet crafting. |
| `SYN + FIN` | **Invalid Combination** | RFC Violation (Simultaneous Open & Close) | **Evasion / OS Fingerprinting**: Used by scanners (`nmap -sF`) to bypass legacy packet filters. |
| `SYN + RST` | **Invalid Combination** | RFC Violation (Simultaneous Connect & Abort) | **Reconnaissance**: Abnormal probe packet designed to elicit differential OS responses. |
| `FIN + RST` | **Invalid Combination** | RFC Violation | **Corrupted / Crafted Packet**: Strongly indicative of malicious crafting. |
| *No Flags* (`0x00`) | **Null Packet** | RFC Violation (No control bits set) | **Null Scan (`nmap -sN`)**: Probes closed ports to determine UNIX vs. Windows stack responses. |

---

## 4. Observations & Evidence: Hunting Protocol Anomalies

### 4.1 Domain Name System (DNS)

DNS operates primarily over **UDP port 53** (with fallback to **TCP port 53** when response payloads exceed 512 bytes). Because external DNS resolution is required for basic network operations, adversaries routinely abuse it for Command and Control (C2) and data exfiltration.

```text
                      +-----------------------------+
                      | Attacker Authoritative Name |
                      |    Server (C2 Listener)     |
                      +-----------------------------+
                                     ^
                                     | Iterative Query Resolution
                                     v
[Compromised Host] ---> [Local DNS Resolver] ---> [Root / TLD Servers]
   (Encodes base64           (Relays
    chunk in subdomains)      unaware)
```

#### Forensic Anomaly 1: DNS Tunneling
* **Attack Mechanism**: Attackers configure an authoritative name server for a malicious domain (e.g., `c2.adversary.net`). Internal malware splits exfiltrated data into chunks, base64/hex-encodes them, and issues queries for nested subdomains:
  ```text
  dGhpcy1pcy1hbi1leGZpbA==.c2.adversary.net
  ```
* **Investigation Heuristics**:
  * Unusually long query names: `dns.qry.name.len > 50`
  * High Shannon entropy within subdomain labels.
  * Excessive volume of `TXT` or `NULL` record types returned from low-reputation zones.
  * Outbound UDP 53 traffic bypassing internal enterprise DNS forwarders.

#### Forensic Anomaly 2: Domain Generation Algorithms (DGA)
* **Attack Mechanism**: Malware families algorithmically generate hundreds of pseudorandom domains per day to connect with active C2 infrastructure.
* **Investigation Heuristics**:
  * Concentrated bursts of `NXDOMAIN` (Non-Existent Domain, `RCODE = 3`) responses.
  * High consonant-to-vowel entropy in domain names (e.g., `emiubkisc.xyz`, `zkqp90vlmx.top`).
  * Excessive queries directed toward low-cost, disposable TLDs (`.top`, `.xyz`, `.cc`).

---

### 4.2 Hypertext Transfer Protocol (HTTP)

HTTP (TCP port 80) represents plaintext application traffic, enabling immediate inspection of raw headers, request bodies, and server responses.

```http
POST /api/v1/telemetry HTTP/1.1
Host: update.legit-cdn.com
User-Agent: python-requests/2.28.1
Content-Type: application/octet-stream
Content-Length: 1048576

[Base64 Encoded Encrypted Exfiltration Payload...]
```

#### Forensic Anomalies in HTTP:
* **Suspicious Request Methods**: High ratios of `POST` or `PUT` methods from desktop clients without accompanying `GET` requests, often signaling data exfiltration or beacon check-ins.
* **Non-Standard or Scripted User-Agents**:
  * Direct script artifacts: `curl/7.88.1`, `python-requests/2.31.0`, `Go-http-client/1.1`, `PowerShell/7.3`.
  * Malformed browser strings (e.g., outdated Gecko revisions, invalid OS/platform combinations).
* **Anomalous Response Status Codes**:
  * `500 Internal Server Error`: Frequently indicates active exploitation attempts (e.g., SQLi, deserialization, or RCE) that triggered backend application exceptions.
  * `404 Not Found` clusters: Indicates automated directory fuzzing or vulnerability scanning tools.
* **Artifact Carving**: Transferred binaries (`MZ` header `0x4D 0x5A`) or scripts (`.ps1`, `.vbs`, `.sh`) can be carved directly from Wireshark via `File -> Export Objects -> HTTP`.

---

### 4.3 Transport Layer Security (TLS)

TLS (TCP port 443) encrypts application payloads, preventing direct deep packet inspection. Analysts must extract structural metadata during the **plaintext TLS Handshake**:

```text
Client                                                   Server
  |                                                         |
  | ----- Client Hello [SNI: attacker-c2.com, JA3] -------> |
  | <---- Server Hello [Cipher Selected, Certificate] ------|
  | <---- Server Key Exchange / Certificate Verify ---------|
  | ----- [Finished: Encrypted Session Established] ------> |
```

#### Metadata Extraction Vectors:
1. **Server Name Indication (SNI)**:
   * Transmitted in plaintext inside the `Client Hello` message (`tls.handshake.type == 1`).
   * Reveals the intended destination fully qualified domain name (FQDN) prior to encryption negotiation.
2. **JA3 / JA3S Passive Fingerprinting**:
   * Collects client parameters: TLS Version, Accepted Ciphers, Extensions, Elliptic Curves, and Point Formats.
   * Produces a 32-character MD5 hash representing the specific client software implementation.
   * Identifies malware client binaries (e.g., Cobalt Strike, Emotet) regardless of changing destination IPs.
3. **Session Decryption**:
   * When endpoint symmetric session keys are acquired via the `SSLKEYLOGFILE` environment variable, Wireshark can decrypt full HTTPS streams in post-incident analysis.

---

### 4.4 Server Message Block (SMB / SMB2)

SMB (TCP port 445) is the primary protocol for Windows file sharing, remote management, and Inter-Process Communication (IPC). It is the primary transport for internal lateral movement.

```text
[Compromised Host]                                  [Domain Controller]
       |                                                    |
       | ----- Session Setup Request [NTLMSSP Auth] ------> |
       | <---- Session Setup Response [0xc000006d FAILURE]  |  (Failed Login)
       |                                                    |
       | ----- Tree Connect Request [\\DC01\ADMIN$] ------> |  (Admin Share)
       | ----- Create Request [Named Pipe: \svcctl] ------> |  (Service Control)
       | ----- Write Request [Launch Malicious Service] --> |  (PsExec Execution)
```

#### Critical Forensic Signatures in SMB:
* **Administrative Share Access**: Tree connects directed to default administrative shares (`C$`, `ADMIN$`, `IPC$`). Workstation-to-workstation administrative share traversal is anomalous in standard environments.
* **Lateral Movement via Named Pipes**: Remote execution frameworks (PsExec, Cobalt Strike) leverage remote RPC named pipes over SMB to manage services:
  * `\pipe\svcctl` (Service Control Manager RPC interface)
  * `\pipe\samr` (Security Account Manager Remote protocol)
  * `\pipe\atsvc` (Task Scheduler interface)
* **Authentication Failures (Password Spraying)**:
  * In SMB2, repeated authentication failures generate the NT status code:
    `STATUS_LOGON_FAILURE` (`0xc000006d`)
  * Wireshark Display Filter: `smb2.nt_status == 0xc000006d`

---

## 5. Automated Triage & CLI Pipelines with `tshark`

While Wireshark provides rich visual inspection, `tshark` is the superior engine for rapid triage, automated pipelines, and headless extraction over multi-gigabyte captures.

```text
                                [large_capture.pcap]
                                         |
                                         v
                         tshark -r capture.pcap -Y "..."
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             [Field Extraction (-T)]               [Object Carving]
                       |                                   |
                       v                                   v
          cut | sort | uniq -c | sort -nr             [Extracted Files]
```

### Essential `tshark` Command Flags
* `-r <file>`: Specifies the source capture file to read.
* `-w <file>`: Writes filtered packets to a new capture file.
* `-Y <display-filter>`: Applies a display filter using standard Wireshark syntax.
* `-T fields`: Emits structured output containing specified field values.
* `-e <field>`: Targets a specific protocol field name for extraction.
* `-E header=y`: Prints field header names in the first line.
* `-E separator=,`: Sets the output delimiter character (e.g., comma for CSV).

### Practical Automated Triage One-Liners

#### Recipe 1: Extract and Rank Unique HTTP User-Agents
Pinpoints automated scanners, scripting engines, or abnormal browser strings:
```bash
tshark -r bkisc.pcap -Y "http.request" \
  -T fields -e http.user_agent \
  | sort | uniq -c | sort -nr
```

#### Recipe 2: Extract All Unique DNS Query Names
Isolates outbound hostname queries to uncover DGA patterns and C2 domains:
```bash
tshark -r bkisc.pcap -Y "dns.flags.response == 0" \
  -T fields -e dns.qry.name \
  | sort -u
```

#### Recipe 3: Extract Plaintext TLS Server Name Indications (SNI)
Maps external encrypted connections without requiring SSL/TLS decryption keys:
```bash
tshark -r bkisc.pcap -Y "tls.handshake.type == 1" \
  -T fields -e tls.handshake.extensions_server_name \
  | sort -u
```

#### Recipe 4: Rank Top Communicating IP Conversations
Ranks top talkers by packet count to identify denial-of-service or high-volume data exfiltration:
```bash
tshark -r bkisc.pcap -q -z conv,ip
```

#### Recipe 5: Automated File Carving from HTTP Streams
Dumps all files transferred over HTTP into a local directory for static and anti-malware analysis:
```bash
tshark -r bkisc.pcap --export-objects "http,./extracted_objects"
```

---

## 6. Threat Hunting & Adversary Tradecraft (MITRE ATT&CK)

### 6.1 Password Spraying ([T1110.003](https://attack.mitre.org/techniques/T1110/003/))

**Threat Mechanism**: Instead of trying many passwords against a single account (triggering lockout policies), the adversary tries a single common password across hundreds of user accounts.

```text
[Attacker Host] 
   |
   +-- (User1, Winter2026!) --> [Port 88 / 445] -> KRB5KDC_ERR_PREAUTH_FAILED (0x18)
   +-- (User2, Winter2026!) --> [Port 88 / 445] -> KRB5KDC_ERR_PREAUTH_FAILED (0x18)
   +-- (User3, Winter2026!) --> [Port 88 / 445] -> KRB5KDC_ERR_PREAUTH_FAILED (0x18)
   +-- (UserN, Winter2026!) --> [Port 88 / 445] -> SUCCESS (Valid Credential Found)
```

#### Forensic Signatures:
* **Kerberos (Port 88)**:
  * High-frequency pre-authentication failure packets returning error code `KRB5KDC_ERR_PREAUTH_FAILED` (`0x18`).
  * Display Filter: `kerberos.error_code == 0x18`
* **SMB (Port 445)**:
  * Clustered `Session Setup Response` failures with error code `0xc000006d` (`STATUS_LOGON_FAILURE`).
  * Display Filter: `smb2.nt_status == 0xc000006d`
* **Triage Command**:
  ```bash
  tshark -r bkisc.pcap -Y "smb2.nt_status == 0xc000006d" \
    -T fields -e ip.src -e smb2.account \
    | sort | uniq -c | sort -nr
  ```

---

### 6.2 Network & Protocol Tunneling ([T1071](https://attack.mitre.org/techniques/T1071/) / [T1572](https://attack.mitre.org/techniques/T1572/))

**Threat Mechanism**: Encapsulating unauthorized traffic within permitted egress protocols to evade perimeter firewall inspection.

#### Real-World Threat Actor Procedures:
1. **Cobalt Strike (S0154)**:
   * Encapsulates custom binary C2 payloads inside standard HTTP GET/POST streams or DNS TXT records.
   * Utilizes internal peer-to-peer communication over SMB Named Pipes (`\pipe\msagent_##`) to evade perimeter monitoring.
2. **Scattered Spider (G1015)**:
   * Deploys modern reverse proxy and tunneling utilities, including **Chisel** (configured through `trycloudflare.com` tunnels), **ngrok**, and **Pinggy**.
   * Establishes outbound TLS connections on standard HTTPS ports to adversary-controlled tunnel exit nodes.
3. **reGeorg (S1187)**:
   * Deploys an obfuscated web shell script on an external DMZ web server.
   * Tunnels arbitrary TCP streams (RDP, SSH, SMB) by packing TCP segments into HTTP POST bodies, allowing direct internal pivoting.

#### Hunting Query: Suspiciously Long DNS Queries
```bash
tshark -r bkisc.pcap -Y "dns.flags.response == 0 && dns.qry.name.len > 50" \
  -T fields -e ip.src -e dns.qry.name
```

---

### 6.3 Deobfuscation & File Carving ([T1140](https://attack.mitre.org/techniques/T1140/))

**Threat Mechanism**: Payloads transferred over the wire are obfuscated using base64, hexadecimal encoding, or custom XOR masks to evade network Intrusion Detection Systems (IDS).

#### Investigation Methodology:
1. **Isolate Data Streams**: Identify high-entropy streams in HTTP POST requests, DNS queries, or TCP payloads.
2. **Carve Raw Objects**: Extract payloads using Wireshark's object export features or `tcpflow`.
3. **Decode Payloads**: Feed extracted artifacts into decoding scripts or recipes in CyberChef:
   * Base64 decoding &rarr; XOR brute-force key discovery &rarr; Gzip decompression.
4. **Identify Magic Bytes**: Inspect file headers to confirm recovered file formats:
   * Windows PE: `4D 5A` (`MZ`)
   * ELF Executable: `7F 45 4C 46` (`.ELF`)
   * PK Zip Archive: `50 4B 03 04` (`PK..`)

---

### 6.4 Periodic Beaconing Analysis

**Threat Mechanism**: Staged malware periodically initiates outbound heartbeat connections to C2 listeners to check for queued tasking.

```text
Connection 1: 10:00:00 UTC (Delta: --)
Connection 2: 10:01:02 UTC (Delta: 62s)
Connection 3: 10:01:59 UTC (Delta: 57s)
Connection 4: 10:03:01 UTC (Delta: 62s)
Connection 5: 10:03:58 UTC (Delta: 57s)
--> Mean Interval = 60s (+/- 3s Jitter)
```

#### Key Characteristics:
* **Time Delta Regularity**: Inter-packet arrival times cluster around a specific baseline interval (e.g., 60 seconds).
* **Jitter Variations**: Advanced C2 frameworks introduce a randomized percentage ("jitter", e.g., &plusmn; 20%) to evade simple threshold-based detection.
* **Payload Size Uniformity**: Heartbeats where no commands are queued often display identical byte lengths across tens of consecutive connections.

---

## 7. Findings, Limitations & References

### Core Takeaways
1. **Packet Capture is the Ground Truth**: When endpoint logs are purged or bypassed, network frames provide unalterable evidence of ingress, execution, lateral movement, and data exfiltration.
2. **Protocol Dissection Trumps Volume**: Effective threat hunting does not require reading every packet. Isolating protocol anomalies—such as non-standard User-Agents, plaintext SNIs, long DNS query lengths, and SMB error codes—rapidly pinpoints adversarial activity.
3. **Command-Line Proficiency is Essential**: Responders must be comfortable using `tshark` to build automated triage pipelines that process multi-gigabyte captures in seconds without GUI bottlenecks.

### Operational Limitations & Modern Challenges
* **Encrypted Client Hello (ECH / ESNI)**: The ongoing deployment of TLS 1.3 Encrypted Client Hello obscures plaintext SNI fields in the `Client Hello` message. This reinforces the need for flow-level behavioral telemetry, JA4 fingerprinting, IP/ASN threat intelligence, and correlation with host-level DFIR artifacts.
* **Full Packet Capture (FPC) Storage Limits**: Enterprise line rates (10 Gbps – 100 Gbps) make continuous full packet capture prohibitively costly to store. Organizations should adopt a hybrid model: generating compact, structured Zeek transaction logs across all links while reserving targeted rolling PCAP buffers for high-risk zones.

### References & Academic Literature
1. Davidoff, S., & Ham, J. (2012). *Network Forensics: Tracking Hackers through Cyberspace*. Prentice Hall. ISBN: 978-0-13-256471-7.
2. Kurose, J. F., & Ross, K. W. (2021). *Computer Networking: A Top-Down Approach* (8th ed.). Pearson. ISBN: 978-0-13-668155-7.
3. Combs, G., & The Wireshark Team. (2026). *Wireshark User's Guide & tshark(1) Manual Page*. Available at [wireshark.org](https://www.wireshark.org/docs/).
4. Hjelmvik, E. (2026). *NetworkMiner - Network Forensic Analysis Tool*. Netresec AB. Available at [netresec.com](https://www.netresec.com/?page=NetworkMiner).
5. MITRE ATT&CK®. (2026). *Adversary Tactics, Techniques, and Common Knowledge*. MITRE Corporation. Available at [attack.mitre.org](https://attack.mitre.org/).
6. Faculty of Computer Science and Engineering, Ho Chi Minh City University of Technology (HCMUT). *Forensics Seminar Series: Network Forensics & PCAP Analysis* (July 2026).
