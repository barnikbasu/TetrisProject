# 🕹️ C-Tetris: A DSA Implementation Project

A fully functional, terminal-based Tetris game written in **C Language**. This project was developed for the Data Structures and Algorithms (DSA) course.

## 👥 The Team
* **[Barnik Basu]** - Game Engine & 2D Array Logic
* **[Sayantan Paul]** - FIFO Queue & LIFO Stack Implementation
* **[Rishav Sahu]** - Linked List Leaderboard & File I/O
* **[Debrup Roy]** - Recursive Search & Sorting Algorithms

---

## 🛠️ DSA Concepts Applied
This project serves as a practical implementation of our CS syllabus:
1. **2D Arrays:** The game board is managed as a `2D integer array` for coordinate mapping and collision detection.
2. **Structures (Structs):** Used to encapsulate `Piece` data, `Game` state, and `Linked List Nodes`.
3. **Queue (FIFO):** A circular array-based queue manages the **Next Piece Preview**, ensuring the first piece generated is the first piece played.
4. **Stack (LIFO):** - **Hold Slot:** Uses a stack to "push" and "pop" Tetrominoes for tactical storage.
   - **Clear History:** A stack stores the history of cleared lines (Single, Double, Triple, Tetris).
5. **Singly Linked List:** The **Leaderboard** is a dynamic linked list that stores player names and scores.
6. **Sorting:** We used **Insertion Sort logic** within the Linked List to ensure the leaderboard is always displayed in descending order.
7. **Recursion:** A **Recursive Binary Search** is implemented to search for specific scores within the high-score data.
8. **Pointers:** Extensively used for memory management and passing complex structures to functions.

---

## 🎮 How to Play

### Controls
| Key | Action |
|:---:|:---|
| **W** | Rotate Piece |
| **A** | Move Left |
| **D** | Move Right |
| **S** | Soft Drop (Move Down) |
| **Space** | Hard Drop (Instant Land) |
| **C** | Hold Piece (Stack Logic) |
| **P** | Pause Game |
| **Q** | Quit |

---

## 🚀 How to Run

### Windows (MinGW/GCC)
1. Open Command Prompt/Terminal.
2. Compile: gcc main.c -o tetris.exe
3. Run: ./tetris.exe

### Linux / macOS
1. Open Terminal.
2. Compile: gcc main.c -o tetris
3. Run: ./tetris

## 📄 Project Features
**Ghost Piece:** Predicts where the block will land using collision look-ahead.

**Leveling System:** Game speed increases as you clear more lines.

**Score Persistence:** High scores are saved to scores.txt using File I/O.

**Combo System:** Extra points for consecutive line clears.
