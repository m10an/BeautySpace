"""Local test HTTP server: omit successful request noise, retain errors."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
class Handler(SimpleHTTPRequestHandler):
    def log_request(self, code='-', size='-'):
        if str(code).isdigit() and int(code)>=400:super().log_request(code,size)
ThreadingHTTPServer(('127.0.0.1',8000),Handler).serve_forever()
