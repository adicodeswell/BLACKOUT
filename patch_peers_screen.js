const fs = require('fs');
const file = 'src/screens/PeersScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: theme.colors.surfaceBorder }]}
            onPress={() => onSelectPeer(item.peer_id, item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineButtonText, { color: theme.colors.textPrimary }]}>Inspect Node</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fillButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onStartChat(item.peer_id)}
            activeOpacity={0.8}
          >
            <NavIcon name="MESSAGE" color="#FFFFFF" size={14} />
            <Text style={styles.fillButtonText}>Message</Text>
          </TouchableOpacity>`,
  `          {!isConnected && (
            <TouchableOpacity
              style={[styles.fillButton, { backgroundColor: theme.colors.severityMedium }]}
              onPress={() => peopleService.connectToPeer(item.peer_id)}
              activeOpacity={0.8}
            >
              <Text style={styles.fillButtonText}>Connect</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: theme.colors.surfaceBorder }]}
            onPress={() => onSelectPeer(item.peer_id, item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineButtonText, { color: theme.colors.textPrimary }]}>Inspect Node</Text>
          </TouchableOpacity>

          {isConnected && (
            <TouchableOpacity
              style={[styles.fillButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => onStartChat(item.peer_id)}
              activeOpacity={0.8}
            >
              <NavIcon name="MESSAGE" color="#FFFFFF" size={14} />
              <Text style={styles.fillButtonText}>Message</Text>
            </TouchableOpacity>
          )}`
);
fs.writeFileSync(file, content);
