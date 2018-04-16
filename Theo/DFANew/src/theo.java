
public class theo {
private boolean finalState = false;
private boolean acceptState = false;
private char name;
  
public theo(char name) {
   this.name = name;
}

public char getName() {
       return name;
   }

   public void setName(char name) {
       this.name = name;
   }

   public boolean isFinalState() {
return finalState;
}
public void setFinalState(boolean finalState) {
this.finalState = finalState;
}
public boolean isAcceptState() {
return acceptState;
}
public void setAcceptState(boolean acceptState) {
this.acceptState = acceptState;
}
}

