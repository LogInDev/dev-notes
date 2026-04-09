detailInfo에 
"추가된 부분 : 10.0.0.1, ... \n
삭제된 부분 : 100.2.2.2, ..."

이런식으로 넣고 싶은데 어떻게해야해??
            String detailInfo = "";
            if(item.get("actCd").equals("ADM")){
                Set<String> added = detail.getAllowedIp().getAdded();
                Set<String> removed = detail.getAllowedIp().getRemoved();

                detailInfo = Optional.of(allowedIpList)
                        .orElse(Collections.emptyList())
                        .stream()
                        .filter(Objects::nonNull)
                        .collect(Collectors.joining(" \n"));
