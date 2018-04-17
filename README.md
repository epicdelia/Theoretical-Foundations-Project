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

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. You will need to 

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing

A step by step series of examples that tell you have to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

Java
Eclipse
