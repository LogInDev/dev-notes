package _string;

import java.util.Scanner;

public class I2_2 {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        String input1 = input.nextLine();
        String answer = "";
//        for (char c : input1.toCharArray()) {
//            if (Character.isUpperCase(c)) {
//             answer = answer + Character.toLowerCase(c);
//            }else  {
//                answer = answer + Character.toUpperCase(c);
//            }
//        }
        for (char c : input1.toCharArray()) {
            if (c<97) {
             answer = answer + (char)(c+32);
            }else  {
                answer = answer + (char)(c-32);
            }
        }
        System.out.println(answer);
    }
}
