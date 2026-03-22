#include "tetris.h"

// Insert score using INSERTION SORT logic in a Singly Linked List
void insert_sorted_score(ScoreNode** head, char* name, int score) {
    ScoreNode* newNode = (ScoreNode*)malloc(sizeof(ScoreNode));
    strcpy(newNode->name, name);
    newNode->score = score;
    newNode->next = NULL;

    // Standard Insertion Sort logic for Linked Lists
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
