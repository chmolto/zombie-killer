# Project Description

What This Game Is About
This game is an isometric shooter where you take control of a character navigating through a forest environment, battling waves of zombies. It’s designed to deliver a survival experience with engaging gameplay mechanics, a 3D visual style powered by React Three Fiber, and a focus on combat and exploration. Below is a detailed explanation of what the game offers:
Game Setting
Environment: The action unfolds in a forest filled with trees and rocks, which act as static obstacles you can use for cover or navigation. The forest is designed to feel immersive yet simple, keeping the focus on survival and combat.

Perspective: The isometric viewpoint gives you a top-down, slightly angled look at the world, blending 2D simplicity with 3D depth.

Your Role: The Player
Character Control: You control a single character who can move freely around the forest. Movement is smooth, with support for diagonal motion, making it easier to dodge enemies or reposition during fights.

Combat: Armed with a weapon, you can shoot bullets to fend off zombies. The shooting comes with a 1-second recharge time between shots, adding a layer of strategy—do you fire now or wait for the perfect moment?

Animations: Your character has a shooting animation to make attacks feel dynamic, and efforts have been made to ensure movement animations look realistic, enhancing the overall experience.

The Enemies: Zombies
Behavior: The forest is crawling with zombies that move toward you, intent on ending your survival streak. They’re relentless but predictable, giving you a chance to outmaneuver them.

Animations: Like the player, zombies have movement animations designed to feel lifelike, making their approach more menacing and immersive.

Core Gameplay Mechanics
Survival Objective: Your main goal is to stay alive by eliminating zombies while managing your resources.

Ammo System: Bullets aren’t infinite. You’ll need to find ammo boxes scattered across the map to keep your weapon loaded, adding a scavenging element to the game.

Scoring: Every zombie you kill earns you points. The more you take down, the higher your score climbs, giving you something to brag about.

Minimap: A handy minimap shows your position, nearby zombies, and ammo box locations, helping you plan your next move.

Game Over: When a zombie gets you, the game ends, and a leaderboard pops up, displaying your final score and ranking your performance.

## Technologies Used

*   **React:** A JavaScript library for building user interfaces.
*   **TypeScript:** A superset of JavaScript that adds static typing.
*   **Vite:** A fast build tool for modern web development.
*   **shadcn-ui:** A collection of accessible and reusable UI components built with Radix UI and Tailwind CSS.
*   **Tailwind CSS:** A utility-first CSS framework.
*   **Zod:** A TypeScript-first schema validation library.
*   **Zustand:** A small, fast, and scalable bearbones state-management solution.
*   **Three.js and react-three/fiber:** A JavaScript library and react reconciler for creating 3D computer graphics in a web browser.
*   **@tanstack/react-query:** For data fetching, caching and state management.

## Project Structure

The project has the following directory structure:

*   `.git`: Contains Git repository information.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `README.md`: Provides a description of the project and instructions for setup.
*   `package.json`: Contains metadata about the project, including dependencies and scripts.
*   `src`:
    *   `App.tsx`: The main application component.
    *   `components`: Reusable UI components.
    *   `hooks`: Custom React hooks.
    *   `pages`: Different pages or routes of the application.
    *   `main.tsx`: The main entry point for the application.
*   `public`: Contains static assets.
*   Configuration files for ESLint, PostCSS, Tailwind CSS, TypeScript, and Vite.

## Scripts

The `package.json` file defines the following scripts:

*   `dev`: Starts the Vite development server.
*   `build`: Builds the project for production.
*   `build:dev`: Builds the project in development mode.
*   `lint`: Runs ESLint to lint the code.
*   `preview`: Starts a preview server to test the production build.

## Additional Information

*   The project is managed using Lovable ([https://lovable.dev/](https://lovable.dev/)).
*   The project uses npm, yarn, or bun as a package manager.
