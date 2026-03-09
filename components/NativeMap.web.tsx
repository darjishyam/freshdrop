import { Text, View } from "react-native";

export const Marker = () => null;
export const UrlTile = () => null;
const MapView = (props) => (
  <View
    style={[
      {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
      },
      props.style,
    ]}
  >
    <Text style={{ color: "#888" }}>Map not supported on Web</Text>
  </View>
);
export default MapView;
