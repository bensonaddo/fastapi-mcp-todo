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

# Start Project with uvicorn
`shuvicorn main:app --reload`


# Sample prompt to create fastapi app
```sh
You're an expert Pythin developer using FastAPI. Your task is to create a simple but complete web application that manages a ToDO list.
Each todo item should include:
- todo_id(interger, primary key)
- Content (string)
- Completed (boolean, default: false)

The APU should support the following CRUD operations:
- Get all todos
- Get a single todo by todo_id
- Add a new todo
- Update an existing todo
- Delete a todo

Requirements:
- Use SQLite as the database(Keep it simple and local)
- Use @app route decorators and a main.py style structure
- Add proper FastAPI docs and type hints
- Follow python best practices(PEP-8, modular design if needed)
- Add a short comment header and inline comments explonaing the purpose of each section
- Add a root route ("/") thst returns a basic welcome message.


Output:
- Full source code for the FastAPI app
- No extra explanations -- just clean , completed production ready code
```

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