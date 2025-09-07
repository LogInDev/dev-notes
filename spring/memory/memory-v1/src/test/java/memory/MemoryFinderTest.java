package memory;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MemoryFinderTest {

    @Test
    void get(){
        // given
        final MemoryFinder memoryFinder = new MemoryFinder();
        final Memory memory = memoryFinder.get();
        System.out.println("memory = " + memory);
        assertThat(memory).isNotNull();
    }

}