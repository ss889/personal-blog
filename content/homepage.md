---
title: Modern Developer Portfolio
date: "2026-03-12"
excerpt: Showcasing my projects, passions, and professional journey in web development and design!
---

## Hero Section

<div class="hero">
  <h1 class="name">[Your Name]</h1>
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
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">Blog</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
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
    font-size: 18px;
    margin-bottom: 8px;
  }

  .post-date {
    color: #666;
    font-size: 14px;
  }
</style>