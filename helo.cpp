#include <iostream>
using namespace std;

int main() {
    string s;
    cin >> s;

    string target = "hello";
    int j = 0;

    for (int i = 0; i < s.length(); i++) {
        if (j < 5 && s[i] == target[j]) {
            j++;
        }
    }

    if (j == 5)
        cout << "YES";
    else
        cout << "NO";

    return 0;
}