#include "tetris.h"

int main() {
    int gameRunning = 1;
    int score = 0;
    StackNode* undoStack = NULL;
    ScoreNode* highScores = NULL;
    
    // Initial Piece Setup
    Piece current = { .shape = {{0,1,0,0},{0,1,0,0},{0,1,0,0},{0,1,0,0}}, .x = 3, .y = 0 };
    Piece next = { .shape = {{0,0,0,0},{0,1,1,0},{0,1,1,0},{0,0,0,0}}, .x = 3, .y = 0 };

    while(gameRunning) {
        if(_kbhit()) {
            char key = _getch();
            if(key == 'a') { current.x--; if(check_collision(current)) current.x++; }
            if(key == 'd') { current.x++; if(check_collision(current)) current.x--; }
            if(key == 'w') { /* Call Rotation logic */ }
            if(key == 'u') { pop_undo(&undoStack, &score); } // UNDO (Stack Pop)
        }

        // Gravity
        current.y++;
        if(check_collision(current)) {
            current.y--;
            push_undo(&undoStack, score); // Save state before locking (Stack Push)
            merge_piece(current);
            clear_lines(&score);
            current = next; // Get from Queue logic
        }

        system("cls"); // Clear screen
        draw_board(current, next);
        Sleep(100); // 100ms delay
    }
    
    insert_score(&highScores, "Team_Player", score);
    display_leaderboard(highScores);
    return 0;
}
