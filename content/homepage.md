---
title: Modern Developer Portfolio
date: "2026-03-13"
excerpt: Showcasing my projects, passions, and professional journey in web development and design!
---

## Hero Section

<div class="hero">
  <h1 class="name">Sab's Blog</h1>
  <p class="bio">Senior Web Developer | Designer | Storyteller</p>
</div>

<style>
  .hero {
    background: linear-gradient(to right, #2f343a, #3b3e5c);
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .name {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .bio {
    font-size: 18px;
    font-weight: 300;
  }
</style>

## Navigation Bar

<nav class="nav">
  <div class="nav-container">
    <ul>
      <li><a href="#">Home</a></li>
      <li><a href="#">Blog</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </div>
</nav>

<style>
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 16px;
    background-color: #2f343a;
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav li {
    display: inline-block;
    margin-right: 32px;
  }

  .nav a {
    color: white;
    text-decoration: none;
  }
</style>

## Projects

<div class="projects">
  <div class="project-grid">
    <!-- Project cards will be generated dynamically -->
  </div>
</div>

<style>
  .projects {
    display: flex;
    justify-content: center;
    padding: 64px;
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }

  .project-card {
    background-color: #3b3e5c;
    border-radius: 16px;
    padding: 24px;
    transition: transform 0.2s ease-in-out;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .project-card:hover {
    transform: translateY(-8px);
  }

  .project-dashboard {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    border-radius: 16px;
    background-color: #3b3e5c;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .project-dashboard:hover {
    transform: translateY(-8px);
  }

  .project-title {
    color: white;
    font-size: 24px;
    margin-bottom: 8px;
  }

  .project-date {
    color: #666;
    font-size: 14px;
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .project-tag {
    background-color: #333;
    color: white;
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 14px;
  }
</style>

## Recent Posts

<div class="posts">
  <div class="post-grid">
    <!-- Post cards will be generated dynamically -->
  </div>
</div>

<style>
  .posts {
    display: flex;
    justify-content: center;
    padding: 64px;
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }

  .post-card {
    background-color: #3b3e5c;
    border-radius: 16px;
    padding: 24px;
    transition: transform 0.2s ease-in-out;
  }

  .post-card:hover {
    transform: translateY(-8px);
  }

  .post-title {
    color: white;
    font-size: 24px;
    margin-bottom: 8px;
  }

  .post-date {
    color: #666;
    font-size: 14px;
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .post-tag {
    background-color: #333;
    color: white;
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 14px;
  }
</style>

## Footer

<div class="footer">
  <p>&copy; 2026 [Your Name]. All rights reserved.</p>
</div>

<style>
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 16px;
    background-color: #2f343a;
    color: white;
    font-family: 'Inter', sans-serif;
  }
</style>
</div>