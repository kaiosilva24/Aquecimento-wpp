#!/usr/bin/env python3
import sys
import subprocess
import os

CONF_FILE = "/etc/wireguard/wg0.conf"

def delete_device(device_name):
    if not os.path.exists(CONF_FILE):
        print(f"Error: {CONF_FILE} not found")
        sys.exit(1)

    with open(CONF_FILE, 'r') as f:
        lines = f.readlines()

    new_lines = []
    
    # We will rebuild the file block by block
    current_block = []
    deleted_count = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Check start of new block
        if stripped.startswith("[Peer]") or stripped.startswith("[Interface]"):
            # Process the previous block we collected
            if current_block:
                block_content = "".join(current_block)
                # Check for Name OR IP match
                # device_name could be "mobile1" or "10.0.0.2"
                is_match = False
                
                if f"# Name: {device_name}" in block_content:
                    is_match = True
                
                # Check IP match (flexible)
                # If device_name looks like an IP or partial IP
                if f"AllowedIPs = {device_name}" in block_content:
                     is_match = True
                
                # Also explicit check if user passed suffix only? No, assume full IP if passing IP
                
                if is_match:
                    deleted_count += 1
                    # DROP this block
                else:
                    # KEEP this block
                    new_lines.append(block_content)
            
            # Start collecting the new block
            current_block = [line]
        else:
            current_block.append(line)

    # Don't forget the very last block in the file
    if current_block:
        block_content = "".join(current_block)
        is_match = False
        if f"# Name: {device_name}" in block_content:
            is_match = True
        if f"AllowedIPs = {device_name}" in block_content:
            is_match = True
            
        if is_match:
            deleted_count += 1
        else:
            new_lines.append(block_content)
            
    if deleted_count == 0:
        print(f"Device/IP '{device_name}' not found in config.")
        # We don't exit 1 here, because maybe it's already gone, which is fine for "Delete" operation.
    else:
        print(f"Removed {deleted_count} entries for device '{device_name}'.")

    # Write the cleaned content back
    with open(CONF_FILE, 'w') as f:
        f.write("".join(new_lines))
        
    # Also delete the .conf file if it exists locally
    # Note: This assumes device_name is the FILENAME (without .conf). 
    # If user passes IP to delete, this file removal might fail/skip, which is acceptable.
    conf_path = f"/home/ubuntu/oracle_scripts/{device_name}.conf"
    if os.path.exists(conf_path):
        os.remove(conf_path)
        print(f"Removed config file: {conf_path}")
    
    # Reload WireGuard
    try:
        subprocess.run("wg syncconf wg0 <(wg-quick strip wg0)", shell=True, executable="/bin/bash", check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to sync WireGuard: {e}")

    # Refresh Gateway (ports)
    subprocess.run(["/home/ubuntu/oracle_scripts/refresh_gateway.sh"], shell=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 delete_device.py <device_name>")
        sys.exit(1)
        
    delete_device(sys.argv[1])
