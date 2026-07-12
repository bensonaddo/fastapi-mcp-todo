# Install Cursor if you don't have
brew install cursor

# Create an account if not already
- You could create a acount using gmail

<!-- Go to cursor settings and add the following docs links -->
- https://fastapi.tiangolo.com/
- https://devdocs.io/fastapi
- https://github.com/tadata-org/fastapi_mcp

# Create Virtual Environment
`python -m venv .venv`

# Activate Virtual Environment
`source .venv/bin/activate`

# Install Dependencies
`pip install fastapi["standard"]` or `pip install requirements.txt`

# Start Dev environment
`fastapi dev main.py`

# Start Project with uvicorn on dev mode
`uvicorn main:app --reload`

# Start App in Prod Mode:
`unicorn main:app --host 0.0.0.0 --port 8000`

# Create MCP and Connect 
Import the module fastapi-mcp module
`pip install fastapi-mcp`

- In source code import the model
- Added operational ID's to the endpoint routes you would like to expose to mcp
- Create mcp server `mcp = FastApiMCP(app, include_operations=[list-of-operational-ids])`
- Mount to app ` mcp.mount()`

# How to connect to MCP
Go to cursor settings and under tools and mcp, add new mcp which would open the mcp.json file
add the below lines to it
```sh
    "fastapi-mcp": {
      "url": "http://localhost:8000/mcp"
    },
```
