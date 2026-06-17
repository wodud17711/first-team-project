package com.example.demo.notification;

import com.example.demo.community.dto.CreateCommentRequest;
import com.example.demo.community.entity.Category;
import com.example.demo.community.entity.Post;
import com.example.demo.community.repository.CategoryRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.community.service.CommentService;
import com.example.demo.community.service.LikeService;
import com.example.demo.notification.dto.NotificationListResponse;
import com.example.demo.notification.entity.NotificationType;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 알림 생성 트리거 → 조회 → 읽음 처리 end-to-end (H2).
 *
 * <p>완료 기준(docs 카드): 내 글에 댓글이 달리면 알림 생성·조회·읽음 처리.
 * 자기 글에 자기가 단 댓글/좋아요는 알림이 생기지 않아야 한다.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationFlowTest {

    @Autowired private CommentService commentService;
    @Autowired private LikeService likeService;
    @Autowired private NotificationService notificationService;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private PostRepository postRepository;

    @Test
    void 내_글에_댓글이_달리면_알림_생성_조회_읽음_처리() {
        User author = saveUser("author@test.com", "글쓴이");
        User commenter = saveUser("commenter@test.com", "댓글러");
        Post post = savePost(author);

        // when: 댓글러가 글쓴이의 글에 댓글
        commentService.createComment(post.getId(), commentRequest("좋은 글이네요"), commenter.getId());

        // then: 글쓴이에게 COMMENT 알림 1건
        NotificationListResponse list =
                notificationService.list(author.getId(), null, false, PageRequest.of(0, 20));
        assertThat(list.notifications()).hasSize(1);
        assertThat(list.unreadCount()).isEqualTo(1);
        var noti = list.notifications().get(0);
        assertThat(noti.type()).isEqualTo(NotificationType.COMMENT.name());
        assertThat(noti.content()).contains("댓글러");
        assertThat(noti.linkUrl()).isEqualTo("/posts/" + post.getId());
        assertThat(noti.isRead()).isFalse();
        // 조회 보강: 게시글 제목 / 댓글 내용 / 반응자 프로필
        assertThat(noti.post()).isNotNull();
        assertThat(noti.post().title()).isEqualTo("제목");
        assertThat(noti.comment()).isNotNull();
        assertThat(noti.comment().content()).isEqualTo("좋은 글이네요");
        assertThat(noti.actor()).isNotNull();
        assertThat(noti.actor().nickname()).isEqualTo("댓글러");
        assertThat(noti.actorCount()).isEqualTo(1);

        // when: 읽음 처리
        notificationService.markRead(author.getId(), noti.notificationId());

        // then: 안읽음 0
        NotificationListResponse after =
                notificationService.list(author.getId(), null, false, PageRequest.of(0, 20));
        assertThat(after.unreadCount()).isZero();
        assertThat(after.notifications().get(0).isRead()).isTrue();
    }

    @Test
    void 좋아요가_눌리면_글작성자에게_알림() {
        User author = saveUser("a2@test.com", "글쓴이2");
        User liker = saveUser("liker@test.com", "좋아요러");
        Post post = savePost(author);

        likeService.toggleLike(post.getId(), liker.getId());

        NotificationListResponse list =
                notificationService.list(author.getId(), null, true, PageRequest.of(0, 20));
        assertThat(list.notifications()).hasSize(1);
        assertThat(list.notifications().get(0).type()).isEqualTo(NotificationType.LIKE.name());
    }

    @Test
    void 같은_글_좋아요는_게시글_기준으로_집계되어_대표1건_외N명() {
        User author = saveUser("a3@test.com", "글쓴이3");
        User liker1 = saveUser("liker1@test.com", "김철수");
        User liker2 = saveUser("liker2@test.com", "이영희");
        User liker3 = saveUser("liker3@test.com", "박지민");
        Post post = savePost(author);

        likeService.toggleLike(post.getId(), liker1.getId());
        likeService.toggleLike(post.getId(), liker2.getId());
        likeService.toggleLike(post.getId(), liker3.getId());

        NotificationListResponse list =
                notificationService.list(author.getId(), null, false, PageRequest.of(0, 20));

        // 좋아요 알림 3건이 한 게시글 기준으로 묶여 대표 1건만
        assertThat(list.notifications()).hasSize(1);
        var noti = list.notifications().get(0);
        assertThat(noti.type()).isEqualTo(NotificationType.LIKE.name());
        // 대표 = 가장 최근 반응자(박지민), 총 인원 3 → "박지민님 외 2명"
        assertThat(noti.actor().nickname()).isEqualTo("박지민");
        assertThat(noti.actorCount()).isEqualTo(3);
        assertThat(noti.post().title()).isEqualTo("제목");
    }

    @Test
    void 타입으로_필터하면_해당_카테고리만_조회된다() {
        User author = saveUser("a4@test.com", "글쓴이4");
        User actor = saveUser("actor4@test.com", "행위자");
        Post post = savePost(author);

        commentService.createComment(post.getId(), commentRequest("댓글입니다"), actor.getId());
        likeService.toggleLike(post.getId(), actor.getId());

        // 전체 = 2건(댓글 + 좋아요)
        NotificationListResponse all =
                notificationService.list(author.getId(), null, false, PageRequest.of(0, 20));
        assertThat(all.notifications()).hasSize(2);

        // 댓글 탭 = COMMENT 만
        NotificationListResponse comments =
                notificationService.list(author.getId(), NotificationType.COMMENT, false, PageRequest.of(0, 20));
        assertThat(comments.notifications()).hasSize(1);
        assertThat(comments.notifications().get(0).type()).isEqualTo(NotificationType.COMMENT.name());

        // 좋아요 탭 = LIKE 만
        NotificationListResponse likes =
                notificationService.list(author.getId(), NotificationType.LIKE, false, PageRequest.of(0, 20));
        assertThat(likes.notifications()).hasSize(1);
        assertThat(likes.notifications().get(0).type()).isEqualTo(NotificationType.LIKE.name());

        // unreadCount 는 타입과 무관하게 전체 안 읽은 수(2)
        assertThat(likes.unreadCount()).isEqualTo(2);
    }

    @Test
    void 자기_글에_자기가_댓글_좋아요하면_알림_없음() {
        User author = saveUser("self@test.com", "본인");
        Post post = savePost(author);

        commentService.createComment(post.getId(), commentRequest("자문자답"), author.getId());
        likeService.toggleLike(post.getId(), author.getId());

        NotificationListResponse list =
                notificationService.list(author.getId(), null, false, PageRequest.of(0, 20));
        assertThat(list.notifications()).isEmpty();
        assertThat(list.unreadCount()).isZero();
    }

    private User saveUser(String email, String nickname) {
        return userRepository.save(User.builder()
                .email(email)
                .password("{noop}pw")
                .nickname(nickname)
                .build());
    }

    private Post savePost(User author) {
        Category category = categoryRepository.save(Category.builder()
                .name("산책로 추천")
                .subTags("부산")
                .displayOrder(1)
                .build());
        return postRepository.save(Post.builder()
                .user(author)
                .category(category)
                .title("제목")
                .content("내용")
                .build());
    }

    private CreateCommentRequest commentRequest(String content) {
        CreateCommentRequest request = new CreateCommentRequest();
        ReflectionTestUtils.setField(request, "content", content);
        return request;
    }
}
