#include "tetris.h"

// CIRCULAR QUEUE for Next Pieces
void enqueue_piece(PieceQueue* q, Tetromino p) {
    if ((q->rear + 1) % 5 == q->front) return; // Full
    q->rear = (q->rear + 1) % 5;
    q->items[q->rear] = p;
}

Tetromino dequeue_piece(PieceQueue* q) {
    Tetromino p = q->items[q->front];
    q->front = (q->front + 1) % 5;
    return p;
}

// LINKED STACK for Undo Feature
void push_undo(StackNode** top, int current_score) {
    StackNode* newNode = (StackNode*)malloc(sizeof(StackNode));
    newNode->score = current_score;
    // Copy current board state to stack
    for(int i=0; i<HEIGHT; i++)
        for(int j=0; j<WIDTH; j++)
            newNode->board_state[i][j] = board[i][j];
    
    newNode->next = *top;
    *top = newNode;
}
