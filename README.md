# 🎮 C-Tetris — DSA Implementation Project

<p align="center">
  <img src="https://img.shields.io/badge/language-C-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-green?style=for-the-badge" />
</p>

<p align="center">
  <b>A terminal-based Tetris game built in C to demonstrate real-world applications of Data Structures & Algorithms</b>
</p>

---

## 🎥 Gameplay Demo

<p align="center">
  <img src="assets/tetris-demo.gif" width="600"/>
</p>
`

---

## 👥 Team

* **Barnik Basu** — Game Engine & 2D Array Logic
* **Sayantan Paul** — Queue (FIFO) & Stack (LIFO) Implementation
* **Rishav Sahu** — Linked List Leaderboard & File I/O
* **Debrup Roy** — Recursion & Searching Algorithms

---

## 🧠 DSA Concepts Applied

This project is a **practical implementation of core computer science concepts**:

### 🔹 Core Data Structures

* **2D Arrays**
  → Game board representation, collision detection

* **Structures (Structs)**
  → Encapsulation of `Piece`, `Game`, and `Node`

* **Queue (FIFO)**
  → Circular queue for **Next Piece Preview**

* **Stack (LIFO)**

  * Hold Piece system
  * Line-clear history tracking

* **Singly Linked List**
  → Dynamic leaderboard with sorted insertion

---

### 🔹 Algorithms & Techniques

* **Sorting (Insertion Logic)**
  → Maintains leaderboard in descending order

* **Recursion (Binary Search)**
  → Efficient score lookup in leaderboard

* **Pointers**
  → Memory handling and data structure manipulation

---

## 🎮 Controls

| Key     | Action         |
| ------- | -------------- |
| `W`     | Rotate Piece   |
| `A`     | Move Left      |
| `D`     | Move Right     |
| `S`     | Soft Drop      |
| `Space` | Hard Drop      |
| `C`     | Hold Piece     |
| `P`     | Pause / Resume |
| `Q`     | Quit           |

---

## 🚀 How to Run

### 🪟 Windows (MinGW / GCC)

```bash
gcc main.c -o tetris.exe
tetris.exe
```

### 🐧 Linux / macOS

```bash
gcc main.c -o tetris
./tetris
```

---

## ✨ Features

* 👻 **Ghost Piece** → Predicts landing position
* 📈 **Level System** → Speed increases with progress
* 💾 **Score Persistence** → Stored in `scores.txt`
* 🔥 **Combo System** → Bonus for consecutive clears
* 👀 **Next Piece Preview** → Queue-based system
* 🎯 **Hold Mechanism** → Stack-based gameplay feature

---

## 📊 Complexity Analysis

| Operation          | Complexity |
| ------------------ | ---------- |
| Queue Operations   | O(1)       |
| Stack Operations   | O(1)       |
| Linked List Insert | O(n)       |
| Binary Search      | O(log n)   |
| Collision Check    | O(1)       |

---

## 📁 Project Structure

```bash
.
├── main.c
├── scores.txt
└── assets/
    └── tetris-demo.gif
```

---

## 💡 Key Highlights

* Integration of **multiple DSA concepts in one real-time system**
* Efficient and modular design using **struct-based architecture**
* Demonstrates **practical application of theoretical concepts**
* Fully playable game with real mechanics

---

## 📜 License

This project is for **academic** and **educational purposes**.

---

⭐ Acknowledgement

Inspired by the original Tetris game concept and implemented as part of a DSA academic project to demonstrate practical usage of fundamental data structures.

---

## ⭐ Support

If you like this project:

* ⭐ Star the repository
* 🍴 Fork it
* 🛠️ Contribute

---

<p align="center">
  <b>“From Data Structures to a Playable System.”</b>
</p>
