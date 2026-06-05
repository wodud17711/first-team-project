package com.example.demo.dog.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.dto.DogCreateRequest;
import com.example.demo.dog.dto.DogResponse;
import com.example.demo.dog.dto.DogUpdateRequest;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.DogBreed;
import com.example.demo.dog.entity.Gender;
import com.example.demo.dog.repository.DogBreedRepository;
import com.example.demo.dog.repository.DogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DogServiceTest {

    @Mock
    DogRepository dogRepository;

    @Mock
    DogBreedRepository dogBreedRepository;

    @InjectMocks
    DogService dogService;

    // ===== register =====

    @Test
    @DisplayName("register: 견종 ID 가 있으면 견종을 조회해 연결하고 로그인 사용자 소유로 저장한다")
    void register_withBreed_success() {
        Long userId = 10L;
        Long breedId = 12L;
        DogBreed breed = newBreed(breedId, "포메라니안", false, 2, 4);
        given(dogBreedRepository.findById(breedId)).willReturn(Optional.of(breed));
        given(dogRepository.save(any(Dog.class))).willAnswer(inv -> {
            Dog d = inv.getArgument(0);
            setField(d, "id", 1L);
            return d;
        });

        DogCreateRequest request = new DogCreateRequest(
                "초코",
                breedId,
                LocalDate.of(2022, 3, 15),
                new BigDecimal("3.2"),
                Gender.F,
                true,
                "중",
                "슬개골 탈구 1기",
                "https://img.example.com/choco.jpg",
                List.of(16, 1, 3),
                true
        );

        DogResponse response = dogService.register(userId, request);

        assertThat(response.dogId()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("초코");
        assertThat(response.gender()).isEqualTo(Gender.F);
        assertThat(response.weight()).isEqualByComparingTo(new BigDecimal("3.2"));
        assertThat(response.breed()).isNotNull();
        assertThat(response.breed().breedId()).isEqualTo(breedId);
        assertThat(response.breed().nameKr()).isEqualTo("포메라니안");
        // CSV 저장 시 중복 제거 + 오름차순 정렬되어 응답된다
        assertThat(response.favorWalkTime()).containsExactly(1, 3, 16);
        assertThat(response.isMain()).isTrue();
        verify(dogRepository).save(any(Dog.class));
    }

    @Test
    @DisplayName("register: breedId 가 null 이면 견종 조회 없이 저장한다 (Mix 등)")
    void register_withoutBreed_success() {
        Long userId = 10L;
        given(dogRepository.save(any(Dog.class))).willAnswer(inv -> inv.getArgument(0));

        DogCreateRequest request = new DogCreateRequest(
                "보리", null, null, null, Gender.M, null, null, null, null, null, null
        );

        DogResponse response = dogService.register(userId, request);

        assertThat(response.name()).isEqualTo("보리");
        assertThat(response.breed()).isNull();
        verify(dogBreedRepository, never()).findById(any());
    }

    @Test
    @DisplayName("register: 존재하지 않는 breedId → BREED_NOT_FOUND")
    void register_breedNotFound() {
        Long userId = 10L;
        Long breedId = 999L;
        given(dogBreedRepository.findById(breedId)).willReturn(Optional.empty());

        DogCreateRequest request = new DogCreateRequest(
                "초코", breedId, null, null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> dogService.register(userId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.BREED_NOT_FOUND);
        verify(dogRepository, never()).save(any());
    }

    @Test
    @DisplayName("register: 첫 등록견은 isMain 요청과 무관하게 자동으로 대표가 된다")
    void register_firstDog_autoMain() {
        Long userId = 10L;
        given(dogRepository.countByUserId(userId)).willReturn(0L);
        given(dogRepository.save(any(Dog.class))).willAnswer(inv -> inv.getArgument(0));

        DogCreateRequest request = new DogCreateRequest(
                "보리", null, null, null, null, null, null, null, null, null, false
        );

        DogResponse response = dogService.register(userId, request);

        assertThat(response.isMain()).isTrue();
    }

    @Test
    @DisplayName("register: 두 번째 견을 대표로 등록하면 기존 대표가 해제된다 (유저당 1마리)")
    void register_secondDogAsMain_clearsPreviousMain() {
        Long userId = 10L;
        Dog previousMain = newDog(1L, userId, "초코");
        previousMain.markAsMain();
        given(dogRepository.countByUserId(userId)).willReturn(1L);
        given(dogRepository.findByUserIdAndMainTrue(userId)).willReturn(Optional.of(previousMain));
        given(dogRepository.save(any(Dog.class))).willAnswer(inv -> inv.getArgument(0));

        DogCreateRequest request = new DogCreateRequest(
                "보리", null, null, null, null, null, null, null, null, null, true
        );

        DogResponse response = dogService.register(userId, request);

        assertThat(response.isMain()).isTrue();
        assertThat(previousMain.isMain()).isFalse();
    }

    @Test
    @DisplayName("register: 두 번째 견을 대표 아님으로 등록하면 기존 대표는 유지된다")
    void register_secondDogNotMain_keepsPreviousMain() {
        Long userId = 10L;
        given(dogRepository.countByUserId(userId)).willReturn(1L);
        given(dogRepository.save(any(Dog.class))).willAnswer(inv -> inv.getArgument(0));

        DogCreateRequest request = new DogCreateRequest(
                "보리", null, null, null, null, null, null, null, null, null, false
        );

        DogResponse response = dogService.register(userId, request);

        assertThat(response.isMain()).isFalse();
        verify(dogRepository, never()).findByUserIdAndMainTrue(any());
    }

    // ===== findMyDogs =====

    @Test
    @DisplayName("findMyDogs: 호출자 userId 의 반려견을 최신순으로 반환한다")
    void findMyDogs_returnsOwnList() {
        Long userId = 10L;
        Dog d1 = newDog(1L, userId, "초코");
        Dog d2 = newDog(2L, userId, "보리");
        given(dogRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .willReturn(List.of(d1, d2));

        List<DogResponse> result = dogService.findMyDogs(userId);

        assertThat(result).extracting(DogResponse::name)
                .containsExactly("초코", "보리");
        verify(dogRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    // ===== findOne =====

    @Test
    @DisplayName("findOne: 본인 반려견 상세 조회 성공")
    void findOne_success() {
        Long userId = 10L;
        Long dogId = 1L;
        given(dogRepository.findById(dogId)).willReturn(Optional.of(newDog(dogId, userId, "초코")));

        DogResponse response = dogService.findOne(userId, dogId);

        assertThat(response.dogId()).isEqualTo(dogId);
        assertThat(response.name()).isEqualTo("초코");
    }

    @Test
    @DisplayName("findOne: 없는 dogId → DOG_NOT_FOUND")
    void findOne_dogNotFound() {
        given(dogRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> dogService.findOne(10L, 999L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DOG_NOT_FOUND);
    }

    @Test
    @DisplayName("findOne: 남의 반려견 조회 시 → NOT_YOUR_DOG")
    void findOne_notOwner() {
        Long myId = 10L;
        Long otherId = 99L;
        Long dogId = 1L;
        given(dogRepository.findById(dogId)).willReturn(Optional.of(newDog(dogId, otherId, "초코")));

        assertThatThrownBy(() -> dogService.findOne(myId, dogId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_YOUR_DOG);
    }

    // ===== update =====

    @Test
    @DisplayName("update: 부분 수정 — null 인 필드는 변경 안 됨")
    void update_partialSuccess() {
        Long userId = 10L;
        Long dogId = 1L;
        Dog dog = newDog(dogId, userId, "초코");
        given(dogRepository.findById(dogId)).willReturn(Optional.of(dog));

        DogUpdateRequest request = new DogUpdateRequest(
                "초콜릿",   // 이름만 변경
                null, null, null, null, null, null, null, null, null, null
        );

        DogResponse response = dogService.update(userId, dogId, request);

        assertThat(response.name()).isEqualTo("초콜릿");
        assertThat(dog.getName()).isEqualTo("초콜릿");
    }

    @Test
    @DisplayName("update: 남의 반려견 수정 시 → NOT_YOUR_DOG")
    void update_notOwner() {
        Long myId = 10L;
        Long otherId = 99L;
        Long dogId = 1L;
        given(dogRepository.findById(dogId)).willReturn(Optional.of(newDog(dogId, otherId, "초코")));

        DogUpdateRequest request = new DogUpdateRequest(
                "이름변경", null, null, null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> dogService.update(myId, dogId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_YOUR_DOG);
    }

    @Test
    @DisplayName("update: 새 breedId 가 잘못되면 → BREED_NOT_FOUND")
    void update_breedNotFound() {
        Long userId = 10L;
        Long dogId = 1L;
        given(dogRepository.findById(dogId)).willReturn(Optional.of(newDog(dogId, userId, "초코")));
        given(dogBreedRepository.findById(999L)).willReturn(Optional.empty());

        DogUpdateRequest request = new DogUpdateRequest(
                null, 999L, null, null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> dogService.update(userId, dogId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.BREED_NOT_FOUND);
    }

    @Test
    @DisplayName("update: isMain=true 로 변경하면 기존 대표가 해제되고 이 견이 대표가 된다")
    void update_setMain_switchesMain() {
        Long userId = 10L;
        Long dogId = 2L;
        Dog target = newDog(dogId, userId, "보리");
        Dog previousMain = newDog(1L, userId, "초코");
        previousMain.markAsMain();
        given(dogRepository.findById(dogId)).willReturn(Optional.of(target));
        given(dogRepository.findByUserIdAndMainTrue(userId)).willReturn(Optional.of(previousMain));

        DogUpdateRequest request = new DogUpdateRequest(
                null, null, null, null, null, null, null, null, null, null, true
        );

        DogResponse response = dogService.update(userId, dogId, request);

        assertThat(response.isMain()).isTrue();
        assertThat(target.isMain()).isTrue();
        assertThat(previousMain.isMain()).isFalse();
    }

    @Test
    @DisplayName("update: favorWalkTime 에 빈 배열을 주면 전체 해제된다")
    void update_emptyFavorWalkTime_clears() {
        Long userId = 10L;
        Long dogId = 1L;
        Dog dog = newDog(dogId, userId, "초코");
        dog.changeFavorWalkTime("1,3,16");
        given(dogRepository.findById(dogId)).willReturn(Optional.of(dog));

        DogUpdateRequest request = new DogUpdateRequest(
                null, null, null, null, null, null, null, null, null, List.of(), null
        );

        DogResponse response = dogService.update(userId, dogId, request);

        assertThat(response.favorWalkTime()).isEmpty();
        assertThat(dog.getFavorWalkTime()).isNull();
    }

    @Test
    @DisplayName("update: favorWalkTime 이 null 이면 기존 값이 유지된다 (부분 수정)")
    void update_nullFavorWalkTime_keepsExisting() {
        Long userId = 10L;
        Long dogId = 1L;
        Dog dog = newDog(dogId, userId, "초코");
        dog.changeFavorWalkTime("1,3,16");
        given(dogRepository.findById(dogId)).willReturn(Optional.of(dog));

        DogUpdateRequest request = new DogUpdateRequest(
                "초콜릿", null, null, null, null, null, null, null, null, null, null
        );

        DogResponse response = dogService.update(userId, dogId, request);

        assertThat(response.favorWalkTime()).containsExactly(1, 3, 16);
    }

    // ===== delete =====

    @Test
    @DisplayName("delete: 본인 반려견 소프트 삭제 — deletedAt 이 채워진다")
    void delete_success() {
        Long userId = 10L;
        Long dogId = 1L;
        Dog dog = newDog(dogId, userId, "초코");
        given(dogRepository.findById(dogId)).willReturn(Optional.of(dog));

        dogService.delete(userId, dogId);

        assertThat(dog.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("delete: 남의 반려견 삭제 시 → NOT_YOUR_DOG")
    void delete_notOwner() {
        Long myId = 10L;
        Long otherId = 99L;
        Long dogId = 1L;
        Dog dog = newDog(dogId, otherId, "초코");
        given(dogRepository.findById(dogId)).willReturn(Optional.of(dog));

        assertThatThrownBy(() -> dogService.delete(myId, dogId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_YOUR_DOG);

        assertThat(dog.getDeletedAt()).isNull();
    }

    // ---------- helpers ----------

    private static Dog newDog(Long id, Long userId, String name) {
        Dog dog = Dog.create(userId, null, name, null, null, null, false, false, null, null, null, null);
        setField(dog, "id", id);
        return dog;
    }

    private static DogBreed newBreed(Long id, String nameKr, boolean brachy, int heat, int cold) {
        DogBreed breed = newInstance(DogBreed.class);
        setField(breed, "id", id);
        setField(breed, "nameKr", nameKr);
        setField(breed, "brachycephalic", brachy);
        setField(breed, "heatTolerance", heat);
        setField(breed, "coldTolerance", cold);
        return breed;
    }

    private static <T> T newInstance(Class<T> clazz) {
        try {
            var ctor = clazz.getDeclaredConstructor();
            ctor.setAccessible(true);
            return ctor.newInstance();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static void setField(Object target, String name, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(name);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
