#ifndef TETRIS_H
#define TETRIS_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define WIDTH 10
#define HEIGHT 20

// 1. Array & Struct Usage
typedef struct {
    int shape[4][4];
    int x, y;
    int color;
} Tetromino;

// 2. Queue for "Next Piece" (Circular Queue - Array Implementation)
typedef struct {
    Tetromino items[5];
    int front, rear;
} PieceQueue;

// 3. Stack for "Undo" (Linked List Implementation)
typedef struct StackNode {
    int board_state[HEIGHT][WIDTH];
    int score;
    struct StackNode* next;
} StackNode;

// 4. Linked List for High Scores
typedef struct ScoreNode {
    char name[20];
    int score;
    struct ScoreNode* next;
} ScoreNode;

// Global Board
extern int board[HEIGHT][WIDTH];

// Function Prototypes (Divided by Member)
void init_game();
void draw_board();
int check_collision(Tetromino p);
void rotate_piece(Tetromino *p);
void enqueue_piece(PieceQueue* q, Tetromino p);
Tetromino dequeue_piece(PieceQueue* q);
void push_undo(StackNode** top, int current_score);
void insert_sorted_score(ScoreNode** head, char* name, int score);

#endif
