# Tapestry: Intelligent Design Matchmaking

Tapestry is a  [Proof of Concept](http://www.proofofconcept.pub) experiment.

Problem statement: I get reached out by a lot of people in my network asking for recommendations of designers. Though I'd like to help, this is time consuming and often results in me needing to manually go through a repository of talent.

<img width="540" alt="Screenshot 2025-06-19 at 10 43 00 PM" src="https://github.com/user-attachments/assets/3f773bfa-6313-4df8-9538-ff113fad6e9b" />


## Tech stack
- Replit for vibe coding - [Use my referral](https://replit.com/refer/dh-design)
- SendGrid for email
- Backend: Flask (Python)`
- Frontend: React with Tailwind CSS
- Database: PostgreSQL (Replit's built-in)

## Initial prompt

```
Design Matchmaker: A web application for creating and sharing curated listsDesign Matchmaker: A web application for creating and sharing curated lists of recommended designers.

Core features:

User authentication and profile management
AI-powered designer recommendation system
Directory page for adding and managing talent profiles
Ability to create and share designer lists via email or private link
Autocomplete functionality for skills tags
Option to add custom fields when entering talent information
Technical requirements:

Backend: Flask (Python)
Frontend: React with Tailwind CSS
Database: PostgreSQL (Replit's built-in)
External services: SendGrid for email delivery, OpenAI for AI recommendations
Pages:

Marketing homepage (logged-out state)
AI Matchmaker page
Directory page for talent management
Directory data fields:

Personal info (name, title, location, company)
Professional details (level, website, LinkedIn, email)
Skills (multi-item tags with autocomplete)
Availability status
Description (markdown-enabled)
UI/Style:

Modern, professional design with a focus on typography and whitespace
Intuitive form layouts with smooth transitions and helpful tooltips
Color palette inspired by design tools: muted grays, vibrant accents, and a dash of creativity
Use Replit's built-in Postgres database.

Add AI features using OpenAI. of recommended designers.

Core features:

User authentication and profile management
AI-powered designer recommendation system
Directory page for adding and managing talent profiles
Ability to create and share designer lists via email or private link
Autocomplete functionality for skills tags
Option to add custom fields when entering talent information
Technical requirements:

Backend: Flask (Python)
Frontend: React with Tailwind CSS
Database: PostgreSQL (Replit's built-in)
External services: SendGrid for email delivery, OpenAI for AI recommendations
Pages:

Marketing homepage (logged-out state)
AI Matchmaker page
Directory page for talent management
Directory data fields:

Personal info (name, title, location, company)
Professional details (level, website, LinkedIn, email)
Skills (multi-item tags with autocomplete)
Availability status
Description (markdown-enabled)
UI/Style:

Modern, professional design with a focus on typography and whitespace
Intuitive form layouts with smooth transitions and helpful tooltips
Color palette inspired by design tools: muted grays, vibrant accents, and a dash of creativity
Use Replit's built-in Postgres database.

Add AI features using OpenAI.


```

## Product screenshots

### Homepage
![Tapestry 4](https://github.com/user-attachments/assets/515f5172-1d62-4b5e-b334-a812ba1e417f)

### Directory
![Tapestry 2](https://github.com/user-attachments/assets/31c7b3bc-4af6-42c4-912e-53a0b83cded3)

### Intelligent match
![Tapestry 3](https://github.com/user-attachments/assets/614a3940-8d8d-4c0a-a23d-584c013be155)

## Report bugs
There are still many known bugs in the Alpha but if you spot them I would appreciate if you [submit an issue](https://github.com/davidhoang/tapestry/issues).
