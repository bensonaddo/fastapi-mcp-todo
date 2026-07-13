# Ansible — single-VM Docker deployment

Deploys the containerized app to plain VMs (the non-Kubernetes path).

```bash
cp inventory.ini.example inventory.ini      # fill in real hosts; stays out of git
ansible-galaxy collection install community.docker
ansible-playbook -i inventory.ini site.yml \
  -e app_image=ghcr.io/OWNER/fastapi-mcp-todo:v1.0.0 \
  -e database_url='postgresql://todo:***@db-host:5432/todos'
```

## ⚠️ Placeholders — replace before running

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `ghcr.io/OWNER/fastapi-mcp-todo:latest` | [site.yml](site.yml) (`app_image` default) | Your registry path — or always override with `-e app_image=...` |
| `203.0.113.10` example hosts | [inventory.ini.example](inventory.ini.example) | Real VM addresses in your copied `inventory.ini` |
| `database_url` (empty default) | [site.yml](site.yml) | Real PostgreSQL URL — pass via Ansible Vault, not the command line, once real credentials exist |

Notes:
- `inventory.ini` and vault password files are gitignored — keep them local.
- The play fails if `/health` doesn't respond within ~60s, so a bad deploy
  stops the run instead of silently limping.
