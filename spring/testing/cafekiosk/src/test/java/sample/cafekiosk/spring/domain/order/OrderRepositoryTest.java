package sample.cafekiosk.spring.domain.order;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.SpringBootTest;
import sample.cafekiosk.spring.domain.product.Product;
import sample.cafekiosk.spring.domain.product.ProductRepository;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static sample.cafekiosk.spring.domain.order.OrderStatus.CANCELED;
import static sample.cafekiosk.spring.domain.product.ProductSellingStatus.SELLING;
import static sample.cafekiosk.spring.domain.product.ProductType.HANDMADE;

//@SpringBootTest
@DataJpaTest
class OrderRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @DisplayName("판매일자, 판매상태 조건에 해당하는 주문기록을 가져온다.")
    @Test
    void findOrderBy(){
        // given
        LocalDateTime now = LocalDateTime.now();
        OrderStatus orderStatus = OrderStatus.PAYMENT_COMPLETED;
        final Product product1 = createProduct( "001", 1000);
        final Product product2 = createProduct( "002", 3000);
        final Product product3 = createProduct("003", 5000);
       productRepository.saveAll(List.of(product1, product2, product3));

        final Order inRangeOrder1 = Order.create(List.of(product1, product2, product3), now.minusHours(2), orderStatus);
        final Order inRangeOrder2 = Order.create(List.of(product1, product2, product3), now.minusMinutes(30), orderStatus);
        final Order OutRangeOrder1 = Order.create(List.of(product1, product2, product3), now.minusDays(1), orderStatus);
        final Order OutRangeOrder2 = Order.create(List.of(product1, product2, product3), now, orderStatus);
        final Order differentStatusOrder = Order.create(List.of(product1, product2, product3), now.minusMinutes(10), CANCELED);

        orderRepository.saveAll(List.of(inRangeOrder1, inRangeOrder2, OutRangeOrder1, OutRangeOrder2, differentStatusOrder));

        LocalDateTime start = now.minusHours(2);
        LocalDateTime end = now;

        // when
        List<Order> results = orderRepository.findOrdersBy(start, end, orderStatus);

        // then
        assertThat(results)
                .hasSize(2)
                .extracting("orderStatus")
                .containsOnly(orderStatus);
        assertThat(results)
                .extracting("registeredDateTime")
                .allSatisfy(obj -> {
                    LocalDateTime dt = (LocalDateTime) obj;
                    assertThat(dt).isAfterOrEqualTo(start);
                    assertThat(dt).isBefore(end);
                });

    }

    private Product createProduct(String productNumber, int price) {
        return Product.builder()
                .type(HANDMADE)
                .productNumber(productNumber)
                .price(price)
                .sellingStatus(SELLING)
                .name("메뉴 이름")
                .build();
    }
}