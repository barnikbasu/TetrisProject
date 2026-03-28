/*
 * ============================================================
 *  TETRIS  —  DSA Project, 2nd Semester CS
 *  Language : C99  |  Single file, no external libraries
 *  Compile  : gcc tetris.c -o tetris          (Linux/Mac)
 *             gcc tetris.c -o tetris.exe      (Windows/MinGW)
 *  Run      : ./tetris   or   tetris.exe
 * ============================================================
 *
 *  DSA CONCEPTS USED  (all taught up to trees)
 *  --------------------------------------------
 *  1. Struct          -> Piece, Game, Queue, Stack, Node
 *  2. 2D Array        -> board[ROWS][COLS], shape table
 *  3. Queue (FIFO)    -> next-piece preview (circular array)
 *  4. Stack (LIFO)    -> (a) hold-piece slot
 *                        (b) line-clear history log
 *  5. Linked List     -> leaderboard, sorted descending
 *  6. Recursion       -> binary search on score array
 *  7. File I/O        -> persist scores to scores.txt
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

/* ── Platform layer ────────────────────────────────────────── */
#ifdef _WIN32
    #include <conio.h>
    #include <windows.h>
    #define CLEAR        "cls"
    #define SLEEP_MS(ms) Sleep(ms)
    #define KB_HIT()     _kbhit()
    #define GET_CH()     _getch()
#else
    #include <unistd.h>
    #include <termios.h>
    #include <fcntl.h>
    #define CLEAR        "clear"
    #define SLEEP_MS(ms) usleep((ms)*1000)

    int KB_HIT(void) {
        struct termios o, n; int ch, f;
        tcgetattr(STDIN_FILENO, &o);
        n = o; n.c_lflag &= ~(ICANON|ECHO);
        tcsetattr(STDIN_FILENO, TCSANOW, &n);
        f = fcntl(STDIN_FILENO, F_GETFL, 0);
        fcntl(STDIN_FILENO, F_SETFL, f | O_NONBLOCK);
        ch = getchar();
        tcsetattr(STDIN_FILENO, TCSANOW, &o);
        fcntl(STDIN_FILENO, F_SETFL, f);
        if (ch != EOF) { ungetc(ch, stdin); return 1; }
        return 0;
    }
    int GET_CH(void) {
        struct termios o, n;
        tcgetattr(STDIN_FILENO, &o);
        n = o; n.c_lflag &= ~(ICANON|ECHO);
        tcsetattr(STDIN_FILENO, TCSANOW, &n);
        int ch = getchar();
        tcsetattr(STDIN_FILENO, TCSANOW, &o);
        return ch;
    }
#endif

/* ════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════ */
#define ROWS        20
#define COLS        10
#define PREVIEW      3
#define Q_CAP       (PREVIEW + 2)
#define STK_CAP      300
#define MAX_SCORES   10
#define SCORE_FILE  "scores.txt"

static const int PTS[5] = { 0, 100, 300, 500, 800 };

/* ════════════════════════════════════════════════════════════
   DSA 1 — STRUCT : Piece
   ════════════════════════════════════════════════════════════ */
typedef struct {
    int shape[4][4];
    int row, col;
    int type;   /* 0-6 = I O T S Z J L */
    int rot;    /* 0-3                 */
} Piece;

/* ════════════════════════════════════════════════════════════
   DSA 2 — QUEUE (Circular Array, FIFO)
   Next-piece preview: enqueue at rear, dequeue from front.
   ════════════════════════════════════════════════════════════ */
typedef struct {
    int data[Q_CAP];
    int front, rear, count;
} Queue;

void qInit (Queue *q)        { q->front = q->rear = q->count = 0; }
int  qEmpty(Queue *q)        { return q->count == 0; }
int  qFull (Queue *q)        { return q->count == Q_CAP; }
void qPush (Queue *q, int v) {
    if (qFull(q)) return;
    q->data[q->rear] = v;
    q->rear = (q->rear + 1) % Q_CAP;
    q->count++;
}
int  qPop  (Queue *q) {
    if (qEmpty(q)) return -1;
    int v = q->data[q->front];
    q->front = (q->front + 1) % Q_CAP;
    q->count--;
    return v;
}
int  qPeek (Queue *q, int off) {
    if (off >= q->count) return -1;
    return q->data[(q->front + off) % Q_CAP];
}

/* ════════════════════════════════════════════════════════════
   DSA 3 — STACK (Array-based, LIFO)
   Used for BOTH:
     (a) Hold-piece slot  (push type, pop to retrieve)
     (b) Line-clear log   (push cleared count each time)
   ════════════════════════════════════════════════════════════ */
typedef struct {
    int data[STK_CAP];
    int top;
} Stack;

void sInit (Stack *s)        { s->top = -1; }
int  sEmpty(Stack *s)        { return s->top == -1; }
int  sFull (Stack *s)        { return s->top == STK_CAP - 1; }
void sPush (Stack *s, int v) { if (!sFull(s))  s->data[++s->top] = v; }
int  sPop  (Stack *s)        { if (!sEmpty(s)) return s->data[s->top--]; return -1; }
int  sPeek (Stack *s)        { if (!sEmpty(s)) return s->data[s->top];  return -1; }

/* ════════════════════════════════════════════════════════════
   DSA 4 — SINGLY LINKED LIST  (sorted descending by score)
   Leaderboard: each Node = one entry. listInsert keeps order.
   ════════════════════════════════════════════════════════════ */
typedef struct Node {
    char        name[20];
    int         score;
    struct Node *next;
} Node;

Node *listInsert(Node *head, const char *name, int score) {
    Node *nn = (Node *)malloc(sizeof(Node));
    if (!nn) return head;
    strncpy(nn->name, name, 19); nn->name[19] = '\0';
    nn->score = score; nn->next = NULL;
    if (!head || score > head->score) { nn->next = head; return nn; }
    Node *cur = head;
    while (cur->next && cur->next->score >= score) cur = cur->next;
    nn->next = cur->next; cur->next = nn;
    return head;
}

/* ────────────────────────────────────────────────────────────
   DSA 5 — RECURSION : binary search
   Scores are stored descending; we reverse to ascending then
   search recursively. Used to detect if score already exists.
   ──────────────────────────────────────────────────────────── */
int binSearch(int arr[], int lo, int hi, int target) {
    if (lo > hi) return -1;                        /* base case */
    int mid = (lo + hi) / 2;
    if (arr[mid] == target) return mid;            /* found     */
    if (arr[mid] <  target) return binSearch(arr, mid+1, hi, target);
    return                         binSearch(arr, lo, mid-1, target);
}

int scoreInBoard(Node *head, int score) {
    int arr[MAX_SCORES], n = 0;
    Node *c = head;
    while (c && n < MAX_SCORES) { arr[n++] = c->score; c = c->next; }
    /* reverse to ascending */
    int lo=0, hi=n-1;
    while (lo<hi) { int t=arr[lo]; arr[lo]=arr[hi]; arr[hi]=t; lo++; hi--; }
    return binSearch(arr, 0, n-1, score) != -1;
}

void listFree(Node *head) {
    while (head) { Node *t = head->next; free(head); head = t; }
}

/* rank = 1-based row to highlight with '*', -1 = none */
void listPrint(Node *head, int rank) {
    int r = 1;
    printf("  +-----+--------------------+----------+\n");
    printf("  | Rnk | Name               | Score    |\n");
    printf("  +-----+--------------------+----------+\n");
    while (head && r <= MAX_SCORES) {
        printf("  | %c%-2d | %-18s | %-8d |\n",
               r == rank ? '*' : ' ', r, head->name, head->score);
        head = head->next; r++;
    }
    if (r == 1) printf("  |         No scores recorded yet.       |\n");
    printf("  +-----+--------------------+----------+\n");
}

void listSave(Node *head) {
    FILE *fp = fopen(SCORE_FILE, "w");
    if (!fp) return;
    int n = 0;
    while (head && n < MAX_SCORES) {
        fprintf(fp, "%s %d\n", head->name, head->score);
        head = head->next; n++;
    }
    fclose(fp);
}

Node *listLoad(void) {
    FILE *fp = fopen(SCORE_FILE, "r");
    if (!fp) return NULL;
    Node *head = NULL;
    char nm[20]; int sc;
    while (fscanf(fp, "%19s %d", nm, &sc) == 2)
        head = listInsert(head, nm, sc);
    fclose(fp);
    return head;
}

/* ════════════════════════════════════════════════════════════
   SHAPE DATA  —  SHAPES[type][rotation][row][col]
   7 types × 4 rotations × 4×4 grid
   ════════════════════════════════════════════════════════════ */
static const int SHAPES[7][4][4][4] = {
/* 0: I */
{{{0,0,0,0},{1,1,1,1},{0,0,0,0},{0,0,0,0}},
 {{0,0,1,0},{0,0,1,0},{0,0,1,0},{0,0,1,0}},
 {{0,0,0,0},{1,1,1,1},{0,0,0,0},{0,0,0,0}},
 {{0,0,1,0},{0,0,1,0},{0,0,1,0},{0,0,1,0}}},
/* 1: O */
{{{0,1,1,0},{0,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,1,0},{0,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,1,0},{0,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,1,0},{0,1,1,0},{0,0,0,0},{0,0,0,0}}},
/* 2: T */
{{{0,1,0,0},{1,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,0,0},{0,1,1,0},{0,1,0,0},{0,0,0,0}},
 {{0,0,0,0},{1,1,1,0},{0,1,0,0},{0,0,0,0}},
 {{0,1,0,0},{1,1,0,0},{0,1,0,0},{0,0,0,0}}},
/* 3: S */
{{{0,1,1,0},{1,1,0,0},{0,0,0,0},{0,0,0,0}},
 {{1,0,0,0},{1,1,0,0},{0,1,0,0},{0,0,0,0}},
 {{0,1,1,0},{1,1,0,0},{0,0,0,0},{0,0,0,0}},
 {{1,0,0,0},{1,1,0,0},{0,1,0,0},{0,0,0,0}}},
/* 4: Z */
{{{1,1,0,0},{0,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,0,0},{1,1,0,0},{1,0,0,0},{0,0,0,0}},
 {{1,1,0,0},{0,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,0,0},{1,1,0,0},{1,0,0,0},{0,0,0,0}}},
/* 5: J */
{{{1,0,0,0},{1,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,1,0},{0,1,0,0},{0,1,0,0},{0,0,0,0}},
 {{0,0,0,0},{1,1,1,0},{0,0,1,0},{0,0,0,0}},
 {{0,1,0,0},{0,1,0,0},{1,1,0,0},{0,0,0,0}}},
/* 6: L */
{{{0,0,1,0},{1,1,1,0},{0,0,0,0},{0,0,0,0}},
 {{0,1,0,0},{0,1,0,0},{0,1,1,0},{0,0,0,0}},
 {{0,0,0,0},{1,1,1,0},{1,0,0,0},{0,0,0,0}},
 {{1,1,0,0},{0,1,0,0},{0,1,0,0},{0,0,0,0}}}
};

/* 2-char block per type, ghost, empty */
static const char *BLK[7] = {"[]","##","<>","//","$$","((","))"}; 
static const char *PNAME[7] = {"I","O","T","S","Z","J","L"};

/* ════════════════════════════════════════════════════════════
   GAME STATE
   ════════════════════════════════════════════════════════════ */
typedef struct {
    int   board[ROWS][COLS];   /* 0=empty, 1-7=locked piece+1  */
    Piece cur;
    Queue nextQ;               /* DSA: Queue                   */
    Stack clearLog;            /* DSA: Stack (b) clear history */
    Stack holdStk;             /* DSA: Stack (a) hold slot     */
    Node *leaders;             /* DSA: Linked list             */
    int   score, level, lines;
    int   combo;
    int   holdType;            /* -1=empty, 0-6=type           */
    int   holdUsed;            /* once per piece drop          */
    int   gameOver, paused;
} Game;

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

void shapeLoad(Piece *p) {
    int r, c;
    for (r = 0; r < 4; r++)
        for (c = 0; c < 4; c++)
            p->shape[r][c] = SHAPES[p->type][p->rot][r][c];
}

/* Collision check — 2D array traversal O(1) since 4×4 fixed */
int fits(Game *g, Piece *p, int dr, int dc, int nr) {
    int r, c;
    for (r = 0; r < 4; r++) {
        for (c = 0; c < 4; c++) {
            if (!SHAPES[p->type][nr][r][c]) continue;
            int br = p->row + r + dr;
            int bc = p->col + c + dc;
            if (bc < 0 || bc >= COLS) return 0;
            if (br >= ROWS)           return 0;
            if (br < 0)               continue;
            if (g->board[br][bc])     return 0;
        }
    }
    return 1;
}

void spawnPiece(Game *g) {
    while (g->nextQ.count < PREVIEW) qPush(&g->nextQ, rand() % 7);
    int type = qPop(&g->nextQ);
    qPush(&g->nextQ, rand() % 7);
    g->cur.type = type; g->cur.rot = 0;
    g->cur.row  = 0;    g->cur.col = COLS / 2 - 2;
    shapeLoad(&g->cur);
    g->holdUsed = 0;
    if (!fits(g, &g->cur, 0, 0, 0)) g->gameOver = 1;
}

/* Hold: push current type onto holdStk, swap with stored */
void holdPiece(Game *g) {
    if (g->holdUsed) return;
    g->holdUsed = 1;
    int cur = g->cur.type;
    if (g->holdType == -1) {
        g->holdType = cur;
        sPush(&g->holdStk, cur);
        spawnPiece(g);
    } else {
        int prev    = g->holdType;
        g->holdType = cur;
        sPush(&g->holdStk, cur);
        g->cur.type = prev; g->cur.rot = 0;
        g->cur.row  = 0;    g->cur.col = COLS / 2 - 2;
        shapeLoad(&g->cur);
        if (!fits(g, &g->cur, 0, 0, 0)) g->gameOver = 1;
    }
}

/* Lock piece, clear full rows, update score */
void lockAndClear(Game *g) {
    int r, c;
    for (r = 0; r < 4; r++)
        for (c = 0; c < 4; c++)
            if (g->cur.shape[r][c]) {
                int br = g->cur.row + r, bc = g->cur.col + c;
                if (br>=0 && br<ROWS && bc>=0 && bc<COLS)
                    g->board[br][bc] = g->cur.type + 1;
            }

    int cleared = 0;
    for (r = ROWS-1; r >= 0; r--) {
        int full = 1;
        for (c = 0; c < COLS; c++) if (!g->board[r][c]) { full=0; break; }
        if (full) {
            cleared++;
            int a;
            for (a = r; a > 0; a--)
                memcpy(g->board[a], g->board[a-1], COLS*sizeof(int));
            memset(g->board[0], 0, COLS*sizeof(int));
            r++;
        }
    }

    if (cleared > 0) {
        g->combo++;
        int bonus  = (g->combo > 1) ? (g->combo-1)*50 : 0;
        g->score  += PTS[cleared] * g->level + bonus;
        g->lines  += cleared;
        g->level   = g->lines / 10 + 1;
        sPush(&g->clearLog, cleared);   /* DSA: Stack push */
    } else {
        g->combo = 0;
    }
}

int ghostDrop(Game *g) {
    int d = 0;
    while (fits(g, &g->cur, d+1, 0, g->cur.rot)) d++;
    return d;
}

/* ════════════════════════════════════════════════════════════
   DRAW
   ════════════════════════════════════════════════════════════ */

/* Print one row of a mini 4-col piece preview */
static void miniRow(int type, int row) {
    int c;
    for (c = 0; c < 4; c++)
        printf("%s", SHAPES[type][0][row][c] ? BLK[type] : "  ");
}

void draw(Game *g) {
    system(CLEAR);

    /* build render buffer */
    int buf[ROWS][COLS], r, c;
    for (r = 0; r < ROWS; r++)
        for (c = 0; c < COLS; c++)
            buf[r][c] = g->board[r][c];

    /* ghost (value 9) */
    int gd = ghostDrop(g);
    for (r = 0; r < 4; r++)
        for (c = 0; c < 4; c++)
            if (g->cur.shape[r][c]) {
                int br=g->cur.row+gd+r, bc=g->cur.col+c;
                if (br>=0&&br<ROWS&&bc>=0&&bc<COLS&&!buf[br][bc])
                    buf[br][bc]=9;
            }

    /* current piece */
    for (r = 0; r < 4; r++)
        for (c = 0; c < 4; c++)
            if (g->cur.shape[r][c]) {
                int br=g->cur.row+r, bc=g->cur.col+c;
                if (br>=0&&br<ROWS&&bc>=0&&bc<COLS)
                    buf[br][bc]=g->cur.type+1;
            }

    /* pre-fetch sidebar values */
    int n0=qPeek(&g->nextQ,0), n1=qPeek(&g->nextQ,1), n2=qPeek(&g->nextQ,2);
    int lastClr = sPeek(&g->clearLog);
    const char *clrName[]={"","SINGLE","DOUBLE","TRIPLE","TETRIS!"};

    /* header */
    printf("  +--------------------+   +-----------------+\n");
    printf("  |                    |   |  T E T R I S    |\n");
    printf("  | - - - - - - - - - |   +-----------------+\n");

    for (r = 0; r < ROWS; r++) {
        printf("  |");
        for (c = 0; c < COLS; c++) {
            int v = buf[r][c];
            if      (v == 0) printf("  ");
            else if (v == 9) printf("..");
            else             printf("%s", BLK[v-1]);
        }
        printf("|   ");

        switch (r) {
        case 0: printf("Score  : %d", g->score);                    break;
        case 1: printf("Level  : %d", g->level);                    break;
        case 2: printf("Lines  : %d", g->lines);                    break;
        case 3:
            if (g->combo > 1) printf("Combo  : x%d!", g->combo);
            else              printf("Combo  : -");
            break;
        case 4:
            if (lastClr>0 && lastClr<=4)
                printf("Last   : %s", clrName[lastClr]);
            break;

        /* NEXT queue — 3 pieces shown via qPeek (no remove) */
        case 6:  printf("+-----------------+");                      break;
        case 7:  printf("| NEXT (Queue)    |");                      break;
        case 8:
            printf("| %s: ", n0>=0?PNAME[n0]:"?");
            if (n0>=0) miniRow(n0,1); else printf("        ");
            printf(" |");
            break;
        case 9:
            printf("|    ");
            if (n1>=0) miniRow(n1,1); else printf("        ");
            printf(" |");
            break;
        case 10:
            printf("|    ");
            if (n2>=0) miniRow(n2,1); else printf("        ");
            printf(" |");
            break;
        case 11: printf("+-----------------+");                      break;

        /* HOLD slot — uses Stack */
        case 13: printf("+-----------------+");                      break;
        case 14: printf("| HOLD (Stack)    |");                      break;
        case 15:
            printf("| ");
            if (g->holdType >= 0) {
                printf("%s: ", PNAME[g->holdType]);
                miniRow(g->holdType, 1);
            } else {
                printf("  (empty)      ");
            }
            printf(" |");
            break;
        case 16: printf("+-----------------+");                      break;

        /* controls */
        case 18: printf("A/D:Move  W:Rotate  S:Down");               break;
        case 19: printf("SPC:Drop  C:Hold  P:Pause  Q:Quit");        break;

        default: break;
        }
        printf("\n");
    }
    printf("  +--------------------+   +-----------------+\n");
}

/* ════════════════════════════════════════════════════════════
   INPUT
   ════════════════════════════════════════════════════════════ */
void handleInput(Game *g) {
    if (!KB_HIT()) return;
    int key = GET_CH();
    if (g->paused) {
        if (key=='p'||key=='P') g->paused=0;
        return;
    }
    int nr;
    switch (key) {
        case 'a': case 'A':
            if (fits(g,&g->cur,0,-1,g->cur.rot)) g->cur.col--;
            break;
        case 'd': case 'D':
            if (fits(g,&g->cur,0,+1,g->cur.rot)) g->cur.col++;
            break;
        case 's': case 'S':
            if (fits(g,&g->cur,+1,0,g->cur.rot)) g->cur.row++;
            break;
        case 'w': case 'W':
            nr = (g->cur.rot+1)%4;
            if      (fits(g,&g->cur,0, 0,nr)) { g->cur.rot=nr; shapeLoad(&g->cur); }
            else if (fits(g,&g->cur,0,+1,nr)) { g->cur.col++; g->cur.rot=nr; shapeLoad(&g->cur); }
            else if (fits(g,&g->cur,0,-1,nr)) { g->cur.col--; g->cur.rot=nr; shapeLoad(&g->cur); }
            break;
        case ' ':
            g->cur.row += ghostDrop(g);
            lockAndClear(g); spawnPiece(g); break;
        case 'c': case 'C': holdPiece(g);       break;
        case 'p': case 'P': g->paused=1;         break;
        case 'q': case 'Q': g->gameOver=1;       break;
    }
}

/* ════════════════════════════════════════════════════════════
   TICK + LOOP
   ════════════════════════════════════════════════════════════ */
void tick(Game *g) {
    if (fits(g,&g->cur,+1,0,g->cur.rot)) g->cur.row++;
    else { lockAndClear(g); spawnPiece(g); }
}

int tickMs(int level) { int ms=550-level*45; return ms<80?80:ms; }

void gameLoop(Game *g) {
    int elapsed=0;
    while (!g->gameOver) {
        handleInput(g);
        if (g->paused) {
            system(CLEAR);
            printf("\n\n  +---------------------------+\n");
            printf(    "  |         PAUSED            |\n");
            printf(    "  |   Press P to resume...    |\n");
            printf(    "  +---------------------------+\n");
            SLEEP_MS(50); continue;
        }
        elapsed += 50;
        if (elapsed >= tickMs(g->level)) { elapsed=0; tick(g); }
        draw(g);
        SLEEP_MS(50);
    }
}

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */
void gameInit(Game *g) {
    int i;
    memset(g->board, 0, sizeof(g->board));
    qInit(&g->nextQ);
    sInit(&g->clearLog);
    sInit(&g->holdStk);
    g->leaders  = listLoad();
    g->score=g->lines=g->combo=0;
    g->level    = 1;
    g->holdType = -1;
    g->holdUsed = g->gameOver = g->paused = 0;
    for (i=0; i<PREVIEW; i++) qPush(&g->nextQ, rand()%7);
    spawnPiece(g);
}

/* ════════════════════════════════════════════════════════════
   SCREENS
   ════════════════════════════════════════════════════════════ */
void showMenu(void) {
    system(CLEAR);
    printf("\n");
    printf("  +==================================+\n");
    printf("  |        T E T R I S               |\n");
    printf("  |     DSA Project  -  2nd Sem      |\n");
    printf("  +==================================+\n");
    printf("  |  1.  New Game                    |\n");
    printf("  |  2.  Leaderboard                 |\n");
    printf("  |  3.  DSA concepts used           |\n");
    printf("  |  4.  Quit                        |\n");
    printf("  +==================================+\n");
    printf("  Choice: ");
}

void showDSA(void) {
    system(CLEAR);
    printf("\n");
    printf("  +===================================================+\n");
    printf("  |          DSA CONCEPTS USED IN THIS GAME          |\n");
    printf("  +===================================================+\n");
    printf("  |                                                   |\n");
    printf("  |  1. STRUCT       Piece{shape,row,col,type,rot}   |\n");
    printf("  |                  Game{board,queue,stack,list...}  |\n");
    printf("  |                                                   |\n");
    printf("  |  2. 2D ARRAY     board[20][10]  game grid        |\n");
    printf("  |                  SHAPES[7][4][4][4]  all rots    |\n");
    printf("  |                  Collision = 2D array search     |\n");
    printf("  |                                                   |\n");
    printf("  |  3. QUEUE(FIFO)  Next-piece preview              |\n");
    printf("  |                  Circular array, O(1) enq/deq    |\n");
    printf("  |                  peek() shows without removing   |\n");
    printf("  |                                                   |\n");
    printf("  |  4. STACK(LIFO)  (a) Hold-piece slot             |\n");
    printf("  |                  (b) Line-clear history log      |\n");
    printf("  |                  Same struct, two purposes       |\n");
    printf("  |                                                   |\n");
    printf("  |  5. LINKED LIST  Leaderboard, sorted desc.       |\n");
    printf("  |                  Dynamic malloc, insert O(n)     |\n");
    printf("  |                  listInsert keeps order always   |\n");
    printf("  |                                                   |\n");
    printf("  |  6. RECURSION    binSearch() on score array      |\n");
    printf("  |                  Base: lo>hi (not found)         |\n");
    printf("  |                  Base: arr[mid]==target (found)  |\n");
    printf("  |                                                   |\n");
    printf("  |  7. FILE I/O     scores.txt  save & reload       |\n");
    printf("  |                                                   |\n");
    printf("  +===================================================+\n");
    printf("\n  Press Enter to go back...");
    getchar(); getchar();
}

void showGameOver(Game *g) {
    system(CLEAR);
    printf("\n");
    printf("  +==============================+\n");
    printf("  |      G A M E   O V E R       |\n");
    printf("  +==============================+\n");
    printf("  |  Score : %-6d              |\n", g->score);
    printf("  |  Level : %-6d              |\n", g->level);
    printf("  |  Lines : %-6d              |\n", g->lines);
    printf("  +==============================+\n\n");

    /* show clear history from stack — pop and display */
    if (!sEmpty(&g->clearLog)) {
        const char *cn[]={"","Single","Double","Triple","TETRIS!"};
        printf("  Clear history (most recent first):\n");
        int shown=0;
        Stack tmp; sInit(&tmp);
        /* pop all into temp to show in order */
        while (!sEmpty(&g->clearLog)) {
            int v = sPop(&g->clearLog);
            sPush(&tmp, v);
        }
        while (!sEmpty(&tmp) && shown < 8) {
            int v = sPop(&tmp);
            if (v>=1&&v<=4) printf("    -> %s\n", cn[v]);
            shown++;
        }
        printf("\n");
    }

    char name[20];
    printf("  Enter your name: ");
    fflush(stdout);
    scanf("%19s", name);

    /* find rank before inserting */
    int rank=1;
    Node *cur=g->leaders;
    while (cur && cur->score > g->score) { rank++; cur=cur->next; }

    g->leaders = listInsert(g->leaders, name, g->score);
    listSave(g->leaders);

    printf("\n  Your rank: #%d\n\n", rank);
    listPrint(g->leaders, rank);
    listFree(g->leaders);
    g->leaders = NULL;

    printf("\n  Press Enter to continue...");
    getchar(); getchar();
}

/* ════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════ */
int main(void) {
    srand((unsigned int)time(NULL));
    int choice;
    while (1) {
        showMenu();
        if (scanf("%d", &choice) != 1) choice = 4;
        if (choice == 1) {
            Game g;
            gameInit(&g);
            gameLoop(&g);
            if (g.gameOver) showGameOver(&g);
        } else if (choice == 2) {
            system(CLEAR);
            printf("\n  LEADERBOARD\n\n");
            Node *lb = listLoad();
            listPrint(lb, -1);
            listFree(lb);
            printf("\n  Press Enter to go back...");
            getchar(); getchar();
        } else if (choice == 3) {
            showDSA();
        } else {
            printf("\n  Goodbye!\n\n");
            break;
        }
    }
    return 0;
}
