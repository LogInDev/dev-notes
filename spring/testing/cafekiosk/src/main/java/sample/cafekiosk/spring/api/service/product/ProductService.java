package sample.cafekiosk.spring.api.service.product;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sample.cafekiosk.spring.api.controller.product.dto.request.ProductCreateRequest;
import sample.cafekiosk.spring.api.service.product.request.ProductCreateServiceRequest;
import sample.cafekiosk.spring.api.service.product.response.ProductResponse;
import sample.cafekiosk.spring.domain.product.Product;
import sample.cafekiosk.spring.domain.product.ProductRepository;

import java.util.List;
import java.util.stream.Collectors;

import static sample.cafekiosk.spring.domain.product.ProductSellingStatus.*;

/**
 * @Transactional(readOnly = true)
 *
 * - 해당 트랜잭션은 **읽기 전용(read-only)** 모드로 동작합니다.
 * - 내부적으로 JPA는 **변경 감지(dirty checking)** 를 수행하지 않으며,
 *   엔티티의 상태를 저장하기 위한 **스냅샷(snapshot)** 도 생성하지 않습니다.
 *   → 그만큼 **성능이 향상**됩니다.
 *
 * - 주로 단순 조회(Select)용 서비스에서 사용됩니다.
 *   예: @Transactional(readOnly = true) public List<User> findAllUsers() { ... }
 *
 * ✅ CQRS (Command and Query Responsibility Segregation)
 *   - Command(CUD)와 Query(R) 로직을 분리하는 아키텍처 패턴입니다.
 *   - 실제로 대부분의 서비스는 **Read 작업이 80~90% 이상** 차지합니다.
 *
 * ✅ Replication (읽기/쓰기 분리)
 *   - 마스터 DB(Master)는 쓰기(CUD) 처리 전용
 *   - 리플리카 DB(Replica)는 읽기(Read) 처리 전용
 *   - AWS Aurora 같은 클라우드 DB는 **readOnly 트랜잭션**을 통해 리플리카로 자동 라우팅할 수 있음
 *   - 이를 통해 DB 부하를 효율적으로 분산시킬 수 있음
 */
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class ProductService {

    private final ProductRepository productRepository;

    // 동시성 이슈
    @Transactional
    public ProductResponse createProduct(ProductCreateServiceRequest request) {
        final String nextProductNumber = createNextProductNumber();

        Product product = request.toEntity(nextProductNumber);
        final Product savedProduct = productRepository.save(product);

        return ProductResponse.of(savedProduct);
    }

    private String createNextProductNumber(){
        String latestProductNumber = productRepository.findLatestProductNumber();
        if (latestProductNumber == null) {
            return "001";
        }

        int latestProductNumberInt = Integer.parseInt(latestProductNumber);
        final int nextProductNumberInt = latestProductNumberInt + 1;

        return String.format("%03d", nextProductNumberInt);
    }

    public List<ProductResponse> getSellingProducts(){
        final List<Product> products = productRepository.findAllBySellingStatusIn(forDisplay());

        return products.stream()
                .map(ProductResponse::of)
                .collect(Collectors.toList());

    }

}
