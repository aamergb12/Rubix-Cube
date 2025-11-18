# Rubix-Cube 3D Web Simulation  
Live Demo: https://rubix-cube-1qji01h62-aamergb12s-projects.vercel.app/  

A fully interactive 3D Rubik’s Cube simulation built with React, Three.js (via @react-three/fiber), and Vite.  
Twist and rotate faces with drag gestures, scramble/undo/reset the cube, and explore the internal state logic.  
Great for learning 3D transforms, React hooks, and building sophisticated interactive web apps.

---

## 🚀 Features  
* 3D cube rendered using Three.js within a React app.  
* Drag-to-rotate faces: pick a sticker, drag and the face turns with animation.  
* Scramble, Undo & Reset controls.  
* Orbit camera for full cube exploration.  
* Built with Vite for lightning-fast development and deployed on Vercel for production.

---

## 🧱 Tech Stack  
* **Framework**: React (via Vite)  
* **3D Rendering**: Three.js + @react-three/fiber + @react-three/drei  
* **Build Tool**: Vite  
* **Deployment**: Vercel  
* **Language**: TypeScript + JSX  
* **State Model**: Piece/cubie based model (positional + orientation tracking)  

---

## 📁 Project Structure  
/ (project root)
├─ package.json
├─ vite.config.ts
├─ index.html
└─ src/
├─ main.tsx ← React entry point
├─ App.tsx
├─ components/
│ ├─ CubeCanvas.tsx ← Scene wrapper for camera, lights, canvas
│ └─ CubeView.tsx ← Renders cubies, handles drag/turn logic
└─ hooks/
└─ useCube.ts ← Custom hook: cube state, undo/scramble/reset logic

yaml
Copy code

---

## 🕹️ Getting Started (Local)  
1. Clone the repo:  
   ```bash
   git clone https://github.com/aamergb12/Rubix-Cube.git
   cd Rubix-Cube
Install dependencies:

bash
Copy code
npm install
Start dev server:

bash
Copy code
npm run dev
Open http://localhost:5173 in your browser.

Build for production:

bash
Copy code
npm run build
Preview production build:

bash
Copy code
npm run preview
☁️ Deployment (Vercel)
Push your code to GitHub.

In Vercel dashboard, import the project, choose Vite framework preset.

Build command: npm run build

Output directory: dist

Vercel will automatically deploy the site whenever you push to main branch.

🧩 How it Works (Technical)
Cube State Model
The cube is modelled as 26 visible “cubies” (8 corners, 12 edges, 6 centres). Each cubie stores:

its integer position [x,y,z] in the grid of {-1,0,1}³,

its exposed stickers with normals and colours.

Interaction Flow
On pointer down: ray-cast to identify the sticker face.

Build a drag plane & local {u, v, n} basis for that face.

On pointer move: track drag on plane, choose dominant axis (u vs v) to infer rotation direction, live-rotate the selected slice group.

On pointer up: snap the angle to 0°, +90° or -90°, then commit the logical state: apply rotation to all cubies in that slice (update pos & stickers), detach from slice group.

Rendering & 3D Setup
The CubeCanvas.tsx component sets up:

a Canvas with shadows enabled, custom toneMapping and outputColorSpace settings for crisp visuals,

ambient & directional lighting, environment reflections, contact shadows for realism,

OrbitControls for camera navigation, with damping and distance limits.

The CubeView.tsx component uses useMemo to generate solved cubies once, then manages rendering, drag logic, live rotation, and snapping.

Stickers are slightly inset and shrunk to avoid z-fighting (render artifacts like colour bleeding).

✅ Roadmap & Future Work
Add move history/queue allowing multiple turns to be chained and “playback”.

Implement a solver algorithm (e.g. Kociemba) and visualise the solution.

Add UI to export/import cube state (e.g. FLRUB syntax).

Add mobile gesture support (touch pinch/rotate).

Improve visuals: bevelled cubies, highlight active face, custom materials.

Add analytics: move count, timing, scramble difficulty.

🤝 Contributing
Fork the repo.

Create a new branch: git checkout -b feature/your-feature.

Make changes and ensure lint/format checks (if any) pass.

Submit a pull request.

Be sure your commits reference the issue and have descriptive messages.

📄 License
This project is open-source under the MIT License. Feel free to use, modify, and distribute it as you like.

📞 Contact
Built by Aamer Goual Belhamidi — agbelhamidi@gmail.com — with strong interests in AI, ML, cloud engineering & platform development.
Would love feedback or collaboration if you’re working on 3D web, WebGL, or interactive apps.

Enjoy exploring and twisting your cube 🧊
Happy coding!