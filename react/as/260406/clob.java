@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiActionHistoryDetail implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<HistoryDetailDTO> keyList;
    private AllowedIpDetailDTO allowedIp;
    private RootKeyDetailDTO rootKey;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllowedIpDetailDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<String> added;
    private List<String> updated;
    private List<String> removed;
}


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RootKeyDetailDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String previous;
    private String current;
}
