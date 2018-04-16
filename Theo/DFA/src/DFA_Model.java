import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Scanner;

public class DFA_Model {

	public static void main(String[] args) {
		if (0 < args.length) {
		}
		
		else {
			getFile();
		}
		getInputforInclusion();
}

	public static void getFile() {
		
        // Name of the file to open.
		//"DFA-test.txt";
		Scanner reader = new Scanner(System.in);  // Reading from System.in
		System.out.println("Enter filename: ");
		String fileName = reader.nextLine();
		
        // This will reference one line at a time
        String line = null;
       
        try {
            // FileReader reads text files in the default encoding.
            FileReader fileReader = 
                new FileReader(fileName);

            // Always wrap FileReader in BufferedReader.
            BufferedReader bufferedReader = 
                new BufferedReader(fileReader);

            while((line = bufferedReader.readLine()) != null) {
                createSubset(line);
            }   

            // Always close files.
            bufferedReader.close();         
        }
        catch(FileNotFoundException ex) {
            System.out.println(
                "Unable to open file '" + 
                fileName + "'");    
            Path currentRelativePath = Paths.get("");
            String s = currentRelativePath.toAbsolutePath().toString();
            System.out.println("Please make sure your file is in the correct directory. Current relative path is: " + s);
        }
        catch(IOException ex) {
            System.out.println(
                "Error reading file '" 
                + fileName + "'");                  
            // Or we could just do this: 
            // ex.printStackTrace();
        }
    }

private static void createSubset(String line) {
	if (line.length() > 1){
		line = line.substring(1, line.length()-1);
		System.out.println(line);
	}
	else {
		
	}
	}
	
public static void getInputforInclusion() {
	
	// First get the scanner object with the input stream
	Scanner sc = new Scanner(System.in); 

	// Just using do-while here for no reason, you can use a simple while(true) as well
	do{
	    int input = sc.nextInt();  // read the next input
	    if (input == 0) { // check if we need to exit out
	        // break only if 0 is entered, this means we don't want to run the loop anymore
	        break;
	    } else {
	        // otherwise, do something with the input
	    }
	} while(true); // and keep repeating
}
}
	
