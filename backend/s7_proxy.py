#!/usr/bin/env python3
"""
Simple HTTP-to-SOCKS proxy that routes traffic through S7 via WireGuard
This creates an HTTP proxy on the server that forwards to S7's internet
"""

import socket
import select
import threading
import sys

LISTEN_HOST = '0.0.0.0'
LISTEN_PORT = 10888
S7_HOST = '10.0.0.3'  # S7 via WireGuard

def handle_client(client_socket, client_addr):
    """Handle HTTP CONNECT requests and forward to S7"""
    try:
        # Read the HTTP request
        request = client_socket.recv(4096).decode('utf-8', errors='ignore')
        
        # Parse CONNECT request
        lines = request.split('\r\n')
        if not lines or not lines[0].startswith('CONNECT'):
            # Not a CONNECT request, try regular HTTP
            first_line = lines[0].split()
            if len(first_line) >= 2:
                method, url = first_line[0], first_line[1]
                print(f"[{client_addr[0]}] {method} {url}")
            client_socket.close()
            return
        
        # Extract target host:port from CONNECT
        target = lines[0].split()[1]
        host, port = target.split(':')
        port = int(port)
        
        print(f"[{client_addr[0]}] CONNECT {host}:{port} via S7")
        
        # Create socket to target through S7's network
        # We bind to S7's IP to force routing through WireGuard
        target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        target_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, b'wg0')
        target_socket.connect((host, port))
        
        # Send 200 Connection Established
        client_socket.send(b'HTTP/1.1 200 Connection Established\r\n\r\n')
        
        # Bidirectional forwarding
        sockets = [client_socket, target_socket]
        while True:
            readable, _, _ = select.select(sockets, [], [], 30)
            if not readable:
                break
                
            for sock in readable:
                data = sock.recv(8192)
                if not data:
                    return
                    
                if sock is client_socket:
                    target_socket.sendall(data)
                else:
                    client_socket.sendall(data)
                    
    except Exception as e:
        print(f"[{client_addr[0]}] Error: {e}")
    finally:
        try:
            client_socket.close()
        except:
            pass
        try:
            target_socket.close()
        except:
            pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((LISTEN_HOST, LISTEN_PORT))
    server.listen(100)
    
    print(f"✅ S7 Proxy Server running on {LISTEN_HOST}:{LISTEN_PORT}")
    print(f"📱 Routing traffic through S7 ({S7_HOST}) via WireGuard")
    print(f"🔧 Configure system to use: http://localhost:{LISTEN_PORT}")
    print()
    
    try:
        while True:
            client_sock, client_addr = server.accept()
            thread = threading.Thread(target=handle_client, args=(client_sock, client_addr))
            thread.daemon = True
            thread.start()
    except KeyboardInterrupt:
        print("\n⏹️  Stopping proxy server...")
        server.close()

if __name__ == '__main__':
    main()
