#include "tetris.h"

// Function to add a score and keep the list SORTED (Insertion Sort logic)
void insert_score(ScoreNode** head, char* name, int score) {
    ScoreNode* newNode = (ScoreNode*)malloc(sizeof(ScoreNode));
    strcpy(newNode->name, name);
    newNode->score = score;
    newNode->next = NULL;

    // Standard Linked List Insertion Sort
    if (*head == NULL || (*head)->score < score) {
        newNode->next = *head;
        *head = newNode;
    } else {
        ScoreNode* curr = *head;
        while (curr->next != NULL && curr->next->score >= score) {
            curr = curr->next;
        }
        newNode->next = curr->next;
        curr->next = newNode;
    }
}

void display_leaderboard(ScoreNode* head) {
    printf("\n--- LEADERBOARD ---\n");
    ScoreNode* curr = head;
    while(curr != NULL) {
        printf("%s: %d\n", curr->name, curr->score);
        curr = curr->next;
    }
}
