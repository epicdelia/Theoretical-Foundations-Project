public class Transition {
theo input;
Integer symbol;
theo output;

public Transition(theo input, Integer symbol, theo output){
this.input = input;
this.symbol = symbol;
this.output = output;
}
public theo getInputState() {
return input;
}

public Integer getSymbol() {
return symbol;
}

public theo getOutputState() {
return output;
}
}


