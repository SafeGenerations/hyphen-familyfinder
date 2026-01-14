# Hyphen FamilyFinder

Network discovery and relationship mapping application for child welfare case workers.

## Features

- **Case Management** - Track and manage child welfare cases
- **Network Visualization** - Interactive genogram/ecomap for family networks
- **Member Management** - CRUD operations for network members
- **Relationship Tracking** - Map relationships between network members
- **Contact Logging** - Track interactions with network members
- **Search & Discovery** - Find and add potential network members
- **Activity Tracking** - Monitor engagement levels (active/warming/cold)
- **Network Health Scoring** - Automated assessment of support network strength

## Architecture

- **Frontend**: React application
- **Backend**: Azure Functions v4 (Node.js)
- **Database**: Azure CosmosDB (MongoDB API)
- **Hosting**: Azure Static Web Apps

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/cases` | GET, POST | List/create cases |
| `/api/cases/{id}` | GET, PATCH, DELETE | Single case operations |
| `/api/members` | GET, POST | List/create network members |
| `/api/members/{id}` | GET, PATCH, DELETE | Single member operations |
| `/api/relationships` | GET, POST | List/create relationships |
| `/api/relationships/{id}` | GET, PATCH, DELETE | Single relationship operations |
| `/api/network/{childId}` | GET | Get full network graph |
| `/api/network/{childId}/stats` | GET | Get network statistics |

## Local Development

```bash
# Install dependencies
npm install
cd api && npm install

# Start frontend
npm start

# Start API (requires Azure Functions Core Tools)
cd api && func start
```

## Environment Variables

### API (Azure Functions)
- `COSMOS_CONNECTION_STRING` - CosmosDB MongoDB connection string

## Deployment

Automatically deployed to Azure Static Web Apps on push to `main` branch.

## Support

Contact [support@safegenerations.org](mailto:support@safegenerations.org) for help.
