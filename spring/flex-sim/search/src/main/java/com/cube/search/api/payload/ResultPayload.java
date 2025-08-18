package com.cube.search.api.payload;

import com.cube.search.domain.AiResult;
import com.cube.search.domain.AiResultMessage;
import lombok.Data;

import java.util.List;

@Data
public class ResultPayload {
    private AiResult header;
    private List<AiResultMessage> messages;
}
