# Bhavnagris Premium eCommerce Setup Guide

This guide will walk you through setting up the full-stack eCommerce platform for Bhavnagris. The project is split into a **Node.js/Express backend**, a **MySQL database**, and an **Angular frontend** featuring a premium royal Gujarati UI, Three.js 3D elements, and GSAP animations.

---

## 1. Database Setup (MySQL)

1. Open **phpMyAdmin** (or any MySQL client like MySQL Workbench).
2. Create a new database or simply import the provided file.
3. Import the `database.sql` file located in the root directory. This will automatically create the `bhavnagris_db` database, necessary tables (`users`, `products`, `cart`, `orders`, `order_items`), and insert sample products and an admin user.

---

## 2. Backend Setup (Node.js & Express)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Check the `.env` file in the backend folder. Make sure `DB_USER` and `DB_PASSWORD` match your local MySQL credentials.
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=bhavnagris_db
   JWT_SECRET=supersecretbhavnagrisjwtkey2026
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *The server will run at http://localhost:5000.*

---

## 3. Frontend Setup (Angular)

Since Angular requires specific CLI scaffolding, follow these steps to integrate the provided code:

1. In the root project directory (outside the backend folder), generate a new Angular application if you haven't already:
   ```bash
   npm install -g @angular/cli
   ng new frontend-app --routing --style css
   ```
2. Navigate into your new Angular app:
   ```bash
   cd frontend-app
   ```
3. Install the required libraries (Tailwind, GSAP, Three.js):
   ```bash
   npm install tailwindcss postcss autoprefixer gsap three @types/three
   npx tailwindcss init
   ```
4. **Copy the Code:**
   - Copy the contents of the generated `frontend/src` directory (which I have created for you) into your `frontend-app/src` directory, overwriting existing files like `index.html`, `styles.css`, `app.component.ts/html`, etc.
   - Copy the `tailwind.config.js` into your `frontend-app` root.
5. In your `angular.json`, ensure that styles include Tailwind (it will automatically pick it up via PostCSS if configured, or you can just run it).
6. Start the Angular application:
   ```bash
   ng serve
   ```
   *The app will run at http://localhost:4200.*

---

## 4. Features Included

* **Database:** Full MySQL schema with constraints, cascading deletes, and role-based fields.
* **Backend:** REST API handling Authentication (JWT & bcrypt), Product management, Cart logic, and Order processing.
* **Frontend:**
  * **Premium UI/UX:** Styled using Tailwind CSS matching the Royal Saffron, Maroon, and Gold theme.
  * **3D Hero Section:** A Three.js interactive 3D model (represented by a gold Torus Knot as a placeholder for a 3D snack).
  * **Animations:** GSAP ScrollTrigger for revealing product cards and smooth scrolling.
  * **Services:** Fully typed `api.service.ts` connecting the frontend to the Node.js backend.

> **Note:** The product images in the database are set to `assets/products/farsan.png`, etc. You should place your actual product images in the `frontend-app/src/assets/products` folder.
