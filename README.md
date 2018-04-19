The purpose of this program is to model a DFA (Deterministic Finite Automaton) and use it to accept or reject strings
of a DFA language description specified by a text file.  

## How it works
The program takes a DFA description from a text file specified as a command line parameter, or otherwise provided by the user. 
Strings to be tested for validity are entered interactively by the user. The program shows whether the given string is accepted within the rules of the language specified by the text file. 

## Text File input format:
**DFA input format**:

line 1: alphabet - eg. {0,1}

line 2: states - eg. {a,b,c,d,e}

line 3: start state - eg. a

line 4: accept states - eg. {d,e}

lines 5-(and more): transition fn - eg. (a,0)->b

 (a,1)->c
 
 etc.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. You will need to make sure you have eclipse installed and the source code entered in the IDE.


## Running the tests

First you enter the file name and the program will accept or ask you to re-enter the file name. Then after it is finally accepted then you need to enter a string using only 0's and 1's and if not then you will be prompeted that you can only use 0's and 1's. If the string is accepted then "Accepted" is shown in the dialog, and if it is rejected then "No Good, please try again" is shown on the dialog. To exit the program you can press cancel or close window to quit.


## Built With

Java
Eclipse
