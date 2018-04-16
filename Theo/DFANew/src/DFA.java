
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.Optional;
import java.util.Queue;
import java.util.Scanner;
import java.util.Set;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class DFA {
private static LinkedList<Integer> alphabet = new LinkedList<>();
private static List<theo> states = new LinkedList<theo>();
private static theo startState;
private static List<Transition> transitionFunction = new LinkedList<Transition>();
  
public static void main(String[] args) {
   String fileName, input = null;
  
       if (args.length != 0) {
           fileName = args[0];
       }
       else {
           System.out.println("Please enter file name of data file");
           Scanner scanner = new Scanner(System.in);
           fileName = scanner.nextLine();
       }
       File file = new File(fileName);
       try {
           BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(file)));
           String line = null;
           // Read first line of alphabets
           line = br.readLine();
           line = line.substring(1, line.length()-1);
           String[] alphabets = line.split(",");
           // Add alphabets to set
           for (String s: alphabets) {
               addToAlphabet(Integer.parseInt(s));;
           }
           // Read second line of states
           line = br.readLine();
           line = line.substring(1, line.length()-1);
           String[] stateNames = line.split(",");
           // Add states to set
           for (String s: stateNames) {
               theo state = new theo(s.charAt(0));
               state.setAcceptState(true);
               addToStates(state);
           }
           // Read third line of start state
           line = br.readLine();
           startState = getStatebyName(line.charAt(0));
           // Read fourth line of accept states
           line = br.readLine();
           line = line.substring(1, line.length()-1);
           String[] acceptStateNames = line.split(",");
           // Set those states to final states also
           for (String s: acceptStateNames) {
               char name = s.charAt(0);
               states.stream()
                   .filter(state -> state.getName() == name)
                   .forEach(state -> makeFinalState(state));
           }
           //Read fifth line of transition functions
           while((line = br.readLine()) != null) {
               String pattern = "\\((\\w),(\\w)\\)(\\W*)(\\w)";
               Pattern r = Pattern.compile(pattern);
               Matcher m = r.matcher(line);
               while (m.find()) {  
                   Transition transition = new Transition(getStatebyName(m.group(1).charAt(0)), Integer.parseInt(m.group(2)), getStatebyName(m.group(4).charAt(0)));
                   addTransition(transition);
               }
           }   
           br.close();
          
          
       } catch (FileNotFoundException e) {
           e.printStackTrace();
       } catch (IOException e) {
           // TODO Auto-generated catch block
           e.printStackTrace();
       }
       Scanner scanner = new Scanner(System.in);
       while (true) {
           System.out.println("Enter string to test or exit to stop the program");
           input = scanner.nextLine();
           if (input == "exit")
               break;
           else {
               String[] inputArray = input.split("");
               LinkedList<Integer> inputList = new LinkedList<>();
               for (String s: inputArray) {
                   if (!isInteger(s)) {
                       System.out.println("Rejected");
                       break;
                   }
                   inputList.add(Integer.parseInt(s));
               }
               if (calculateFinalState(startState, inputList)) {
                   System.out.println("Accepted");
                   continue;
               }
              
               else {
                   System.out.println("Rejected");
                   continue;
               }
           }
       }
   }

private static boolean isInteger(String s) {
       char c = s.charAt(0);
       return (c >= 48 && c <= 57);
   }

   private static void makeFinalState(theo state) {
       state.setFinalState(true);
   }
  
   private static theo getStatebyName(char name) {
       return states.stream()
               .filter(s -> s.getName() == name)
               .findFirst()
               .get();
   }

   public static void addToAlphabet(Integer symbol) {
alphabet.add(symbol);
}

public static void removeFromAlphabet(Integer symbol){
alphabet.remove(symbol);
}

public static void addToStates(theo state){
states.add(state);
}

public static void removeToState(theo state){
states.remove(state);
}

public static void removeTransition(Transition transition){
transitionFunction.remove(transition);
}

public static void addTransition(Transition transition) throws IllegalArgumentException{
// no 2 outputs for same input+symbol
if(transitionFunction.stream()
.noneMatch(t -> t.getInputState().equals(transition.getInputState()) &&
t.getSymbol() == transition.getSymbol())){
transitionFunction.add(transition);
} else {
throw new IllegalArgumentException();
}
}

public Set<theo> getAcceptStates(){
return states.stream().filter(s -> s.isAcceptState())
.collect(Collectors.toSet());
}

public static boolean calculateFinalState(theo state, Queue<Integer> symbol) {
if(symbol.isEmpty() && state.isFinalState()){
return true;
}
if(!alphabet.contains(symbol.peek())){
return false;
}
Optional<theo> nextState = getNextState(state, symbol.remove());
if(nextState.isPresent()){
return
calculateFinalState(nextState.get(), symbol);
}
return false;
}

private static Optional<theo> getNextState(theo state, Integer alphabet){
return
transitionFunction.stream()
.filter(t -> t.getInputState().equals(state) &&
t.getSymbol() == alphabet)
.map(t -> t.getOutputState()).findFirst();
}
}
