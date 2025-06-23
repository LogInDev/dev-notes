package _string;

import java.util.Scanner;

public class I2_3 {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        String input1 = input.nextLine();
        int maxCnt = Integer.MIN_VALUE, pos;
        String resultWord = "";
        // 방법 1) split() 활용
//        String[] words = input1.split(" ");
//        for (String word : words) {
//            int wordLength = word.length();
//            if (wordLength > maxCnt) {
//                maxCnt = wordLength;
//                resultWord = word;
//            }
//        }
        // 방법 2) indexOf()활용
        while((pos = input1.indexOf(' ')) != -1){
            String word =  input1.substring(0, pos);
            int wordLength = word.length();
            if(wordLength > maxCnt){
                maxCnt = wordLength;
                resultWord = word;
            }
            input1 = input1.substring(pos + 1);
        }
        // 마지막 단어는 포함 안됨 - 마지막 단어만 남은 경우 공백(' ') 이 없으므로 -1 반환
        if(input1.length() > maxCnt){resultWord = input1;}
        System.out.println(resultWord);

    }
}
