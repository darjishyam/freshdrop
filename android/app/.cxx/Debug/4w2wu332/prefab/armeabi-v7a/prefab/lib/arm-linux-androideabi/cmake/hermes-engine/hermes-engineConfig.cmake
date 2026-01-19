if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/jayra/.gradle/caches/8.14.3/transforms/213469c46ae97bed875a8e90dfc92c51/transformed/hermes-android-0.81.5-debug/prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/jayra/.gradle/caches/8.14.3/transforms/213469c46ae97bed875a8e90dfc92c51/transformed/hermes-android-0.81.5-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

