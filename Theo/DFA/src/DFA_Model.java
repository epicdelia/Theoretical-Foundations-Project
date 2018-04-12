import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;

public class DFA_Model {

	public static void main(String[] args) {
		if (0 < args.length) {
		}
		
		else {
			getFile();
		}
}
	

	public static void getFile() {
		
        // Name of the file to open.
        String fileName = "DFA-test.txt";

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
                System.out.println(line);
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
}
	
