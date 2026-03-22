#include "tetris.h"

int board[HEIGHT][WIDTH] = {0};

int check_collision(Tetromino p) {
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            if (p.shape[i][j]) {
                int nx = p.x + j;
                int ny = p.y + i;
                if (nx < 0 || nx >= WIDTH || ny >= HEIGHT || (ny >= 0 && board[ny][nx]))
                    return 1; // Collision
            }
        }
    }
    return 0;
}

// Matrix Rotation (Demonstrating 2D Array manipulation)
void rotate_piece(Tetromino *p) {
    int temp[4][4];
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            temp[j][3-i] = p->shape[i][j];
    
    // Check if rotation is possible
    Tetromino dummy = *p;
    memcpy(dummy.shape, temp, sizeof(temp));
    if (!check_collision(dummy)) {
        memcpy(p->shape, temp, sizeof(temp));
    }
}
