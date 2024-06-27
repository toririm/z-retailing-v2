# Z-retailing

## Prerequisites

- Cloudflare Pages
- Supabase
- Prisma Accelerate
- Bun
- Remix

## Set database timezone

```sql
alter database postgres
set timezone to 'Asia/Tokyo';
```

## ページ遷移

```mermaid
graph TD;

  %% root
  / -->|redirect| USER

  %% login
  subgraph LOGIN
    %% /user -->|if not logged in| /login
    /login -->|email submitted| mail([OTP email])
    mail([OTP email]) --> |enter OTP| /login/verify
  end
  
  LOGIN -->|login| USER

  %% user
  subgraph USER
    /user <-->|link| /user/history/$year/$month
    /user/history/$year/$month -->|other date| /user/history/$year/$month
    /user -->|if not registered| /setup
    %% /setup -->|nickname submitted| /user
  end
  
  USER <-->|link| /timeline
  
  USER <-->|link if admin| ADMIN

  %% admin
  subgraph ADMIN
    /admin <-->|link| /admin/users/$userId
    /admin/users/$userId -->|other user| /admin/users/$userId
    /admin <-->|link| /admin/timeline
  end

  %% independant
  /coffee
```

## ER図
```mermaid
erDiagram 
    USER {
        uuid id PK
        uuid authId
        text name
        text email
        bool admin
        timestamptz createdAt
    }

    ITEM {
        uuid id PK
        text name
        int4 price
        timestamptz createdAt
        timestamptz deletedAt
        uuid ownerId FK
    }

    PURCHASE {
        uuid id PK
        uuid userId FK
        uuid itemId FK
        timestamptz createdAt
        timestamptz deletedAt
    }

    USER ||--o{ ITEM : "owns"
    USER ||--o{ PURCHASE : "makes"
    ITEM ||--o{ PURCHASE : "is part of"
```
