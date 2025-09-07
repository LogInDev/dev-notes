package memory;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MemoryFinder {

    public Memory get(){
        final long max = Runtime.getRuntime().maxMemory();
        final long total = Runtime.getRuntime().totalMemory();
        final long free = Runtime.getRuntime().freeMemory();
        final long used = total - free;
        return new Memory(used, max);
    }

    @PostConstruct
    public void init(){
        log.info("MemoryFinder init");
    }
}
