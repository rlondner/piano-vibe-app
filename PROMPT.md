# Master Prompt: 5-Octave Glassmorphism Web Piano

**Role:** You are an expert web audio developer and UX/UI designer. I want to "vibe code" a responsive, web-based synthesizer piano.

**Task:** Build a single-page web app (using Vanilla HTML, CSS, and JS) that functions as a 5-octave polyphonic piano. 

**CSS Style Guide (Minimalist Glassmorphism):**
* The app must have a modern, sleek glassmorphism aesthetic. 
* Use a vibrant but deep CSS gradient for the `body` background (e.g., deep violet to dark blue) so the glass effect is visible.
* All UI containers (menus, toggles, the ribbon, and the piano chassis) should use semi-transparent backgrounds (`rgba(255, 255, 255, 0.1)`), `backdrop-filter: blur(10px)`, subtle white borders (`1px solid rgba(255, 255, 255, 0.2)`), and soft drop shadows.

**Responsive Layout & The 5-Octave Constraints:**
* The piano engine must support 5 full octaves, but the UI must constrain the visible keys to prevent them from becoming too narrow on smaller screens.
* Use CSS Media Queries / JS ResizeObserver: In Portrait mode (narrow width), show only **1 octave** at a time. In Landscape mode or on larger desktop screens, show **2 octaves** at a time. Hide the remaining octaves via CSS overflow or JS rendering logic.

**Octave Navigation (Swipeable Ribbon):**
* Immediately above the piano keys, render a stylish "Swipeable Ribbon" displaying the currently visible octave range (e.g., "Current: C3 - B3"). Include subtle left and right arrow icons as visual hints.
* Users must be able to swipe this ribbon left or right (using touch events on mobile or mouse-drag on desktop) to slide the viewport up or down the 5-octave range. Ensure it doesn't scroll past the lowest or highest available octaves.

**Audio Engine (Tone.js):**
* Include Tone.js via CDN.
* Create a glassmorphic dropdown menu at the top to switch between these instrument presets: Fender Rhodes, Wurlitzer Electronic Piano, Yamaha CP-70, Yamaha CP-80, Hohner Clavinet, Hohner Pianet, Juno 106, RMI Electra-piano, Yamaha DX7 organ, and Clavia Nord Stage 4 Grand Piano.
* Use Tone.js synths, FM synths, and effects to build approximations