#include "tetris.h"

// QUEUE Logic: Array implementation of a Circular Queue
Piece next_pieces[3];
int head = 0, tail = 0;

void enqueue_piece(Piece p) {
    next_pieces[tail] = p;
    tail = (tail + 1) % 3;
}

Piece dequeue_piece() {
    Piece p = next_pieces[head];
    head = (head + 1) % 3;
    return p;
}

// STACK Logic: Linked List implementation of a Stack for Undo
void push_undo(StackNode** top, int current_score) {
    StackNode* newNode = (StackNode*)malloc(sizeof(StackNode));
    newNode->score_copy = current_score;
    for(int i=0; i<HEIGHT; i++)
        for(int j=0; j<WIDTH; j++)
            newNode->board_copy[i][j] = board[i][j];
    
    newNode->next = *top;
    *top = newNode;
}

void pop_undo(StackNode** top, int* current_score) {
    if (*top == NULL) return;
    StackNode* temp = *top;
    *current_score = temp->score_copy;
    for(int i=0; i<HEIGHT; i++)
        for(int j=0; j<WIDTH; j++)
            board[i][j] = temp->board_copy[i][j];
            
    *top = (*top)->next;
    free(temp);
}
