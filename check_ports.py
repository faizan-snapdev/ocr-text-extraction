import socket
import sys

def check_port(host, port, service_name):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"SUCCESS: {service_name} is running on {host}:{port}")
            return True
        else:
            print(f"WAITING: {service_name} is NOT yet accessible on {host}:{port} (Code: {result})")
            return False
    except Exception as e:
        print(f"ERROR: Failed to check {service_name}: {e}")
        return False
    finally:
        sock.close()

if __name__ == "__main__":
    backend_up = check_port("127.0.0.1", 8000, "Backend (FastAPI)")
    frontend_up = check_port("127.0.0.1", 5137, "Frontend (Vite)")
    
    if backend_up and frontend_up:
        sys.exit(0)
    else:
        sys.exit(1)