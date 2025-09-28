# USOF Backend Documentation

## What Is This?

Welcome to the **USOF backend**, a modest little API pretending it’s StackOverflow. It powers a forum-like platform where users can register, post their hot takes, comment, bicker via likes/dislikes, and curate their knowledge like digital librarians. It even has a shiny **Admin Panel**, because someone has to clean up the mess.

Built with **Node.js, Express, MySQL, and AdminJS**, this backend follows the sacred commandments of **MVC**, **OOP**, and **SOLID**.

---

## CBL Journey (Because Apparently That's a Thing)

### 1. Engage
* Had a big group hug around the *big idea*: exchanging knowledge without becoming Reddit.
* Reflected on burning questions like:
  - “What even is an API?” *(It’s how the frontend stops crying.)*
  - “Why is StackOverflow still alive?” *(Because people copy-paste code into prod.)*
  - “How do we make this better?” *(Spoiler: add favorites.)*
* **Result:** API-based backend justified. Mission mildly understood.

---

### 2. Investigate
* Did some Sherlock Holmes stuff on Q&A platforms:
  - Users need to sign up, sign in, and prove they’re not bots.
  - CRUD: obviously.
  - Admins get to feel important.
  - Sorting and filtering.
* Picked **MySQL** because we enjoy structured data and foreign key drama.
* Chose **AdminJS** because writing your own admin panel is a life choice, not a necessity.
* **Result:** Picked a stack (Node.js + Express + MySQL + AdminJS).

---

### 3. Act: Basic Edition
* Glued together the essentials:
  - **JWT authentication** with password hashing (bcrypt, not duct tape).
  - **User module**: profiles, avatars, and performance-based rating.
  - **Post module**: CRUD + categories + filters + status.
  - **Comments**: now with locking, because people can't behave.
  - **Likes/dislikes**: with SQL triggers calculating user ratings so you don’t have to.
  - **Admin panel**: someone has to be the adult in the room.
* **Result:** Fully functional API with RBAC (Role-Based Access Control).

---

### 4. Act: Deluxe Creative Expansion Pack
* Pushed past the basics, because mediocrity is already crowded:
  - **Favorites system**: like bookmarking, but you feel more special.
  - **Advanced filtering**: by category, date, and “vibes” (status).
  - **Locking mechanism**: because some posts just need to be put in time-out.
* **Result:** More scalable. More useful.

---

### 5. Document
* Wrote a **README.md** because people panic without instructions.
* Documented endpoints with **Swagger UI**.
* You’re reading this because we finished the documentation phase. You're welcome.
* **Result:** The project is understandable, even if you aren’t.

---

### 6. Share
* The code is publishable. Whether the world is ready… is not our problem.

---

## How It Works (a.k.a. “The Algorithm Stuff”)

### 1. System Architecture
Standard **MVC** setup, because reinventing the wheel leads to triangles:

* **Models**
  - Define your friends: `User`, `Post`, `Comment`, `Category`, `Like`, `Favorite`.
  - Use `mysql2` for query execution.
  - Triggers in MySQL update user ratings so we don’t have to.

* **Repositories**
  - Responsible for talking to the database without spilling secrets.
  - Examples:
    - `UserRepository`: make users do things.
    - `PostRepository`: make posts do things.
    - You get the idea.

* **Services**
  - Where business logic pretends to be complicated.
  - Validation, permissions, relationship drama — it’s all handled here.

* **Controllers**
  - Translate HTTP noise into structured service calls.
  - Minimal logic, maximum delegation — like a good manager.

* **Routes**
  - RESTful endpoints grouped by module.
  - Guarded by middlewares like `authMiddleware`, because not everyone deserves access.

* **AdminJS**
  - Because real admins don’t write SQL by hand.

---

### 2. Initialization Algorithm
1. Load `.env`, whisper secrets to the server.
2. Connect to MySQL and run migrations like a responsible adult.
3. Set up Express middlewares:
   - Parse stuff.
   - Serve avatars.
   - Authenticate the unauthentic.
4. Mount routes:
   - `/api/auth` → sign-up & regret.
   - `/api/users` → user management.
   - `/api/posts` → posting and lurking.
   - `/api/categories` → stuff sorting.
   - `/api/favorites` → emotional attachments.
5. Mount AdminJS at `/admin` for the chosen ones.
6. Start server. Hold breath.

---

### 3. Authentication Flow
* **Register**
  1. User submits their info.
  2. Password gets hashed with bcrypt. No plain text sins.
  3. Account created. Email sent. Hope received.
* **Login**
  1. Credentials checked.
  2. JWT created and handed over like a golden ticket.
* **JWT Middleware**
  - Checks token.
  - If valid → carry on.
  - If not → 401 and shame.

---

### 4. User Management
* Users can:
  - Update their profile.
  - Upload avatars that hopefully are memes.
* Admins can:
  - Create/delete users.
  - Assign roles and feel powerful.
* Ratings update via SQL triggers whenever someone feels seen (likes/dislikes).

---

### 5. Post Management
* Posts have: `title`, `content`, `author`, `status`, `categories`.
* Core mechanics:
  - **Create:** attach categories and hope someone reads it.
  - **Update:** only authors can do it, for everyone's safety.
  - **Moderate:** admins can deactivate content that causes too many headaches.
  - **Sort/Filter:** by likes, date, category, or status (you picky thing).

---

### 6. Comment Management
* Comments are attached to posts like barnacles.
* Locking is available for authors/admins to shut things down.
* Visibility is toggled by `active`/`inactive` status.

---

### 7. Likes & Dislikes
* One reaction per user per entity, because chaos is bad.
* SQL triggers update the author’s fragile self-esteem (rating).
* Endpoints:
  - Add.
  - Remove.
  - Read.

---

### 8. Favorites & Extras
* Users can save posts they pretend they’ll come back to.
* AdminJS makes CRUD delightful for grown-ups.
* Locking.

---

### 9. Error Handling & Security
* JSON errors are structured like your therapist’s notes.
* Passwords hashed with bcrypt and salt.
* Role-based access means:
  - **Users** → their own toys.
  - **Admins** → the whole sandbox.

---
