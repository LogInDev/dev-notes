/* fade in/out 반복 효과 */
@keyframes cubeFade {
  0% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

/* 이미지에 적용할 클래스 */
.img-fade {
  animation: cubeFade 1.6s ease-in-out infinite;
}

<img
  src="/images/cube-loading.png"   // 디자이너가 준 이미지 경로
  alt="loading..."
  className="img-fade"
/>