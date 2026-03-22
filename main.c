#include "tetris.h"
#include <conio.h> // For Windows (kbhit)

int main() {
    int gameRunning = 1;
    int score = 0;
    PieceQueue pq = { .front = 0, .rear = 0 };
    StackNode* undoStack = NULL;
    ScoreNode* highScores = NULL;

    // 1. Initial Enqueue of pieces
    // enqueue_piece(&pq, generateRandomPiece()); ...

    while (gameRunning) {
        if (kbhit()) {
            char ch = getch();
            if (ch == 'u') { // UNDO triggers Stack Pop
                // Logic to pop from undoStack and restore board
            }
            // Handle arrow keys...
        }
        
        // Gravity logic, Collision logic...
        
        // If piece lands:
        push_undo(&undoStack, score); // Save state before change
        
        // Draw the game
        draw_board();
    }

    // End of game: Insertion Sort Score into Linked List
    insert_sorted_score(&highScores, "Player1", score);
    
    return 0;
}
